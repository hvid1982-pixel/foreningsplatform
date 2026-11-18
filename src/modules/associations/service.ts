/**
 * Supply-side use cases: association onboarding, profile, channels, locations,
 * industry exclusions and offerings, plus the admin review of associations and
 * offerings. Every function takes an `Actor` and checks access first.
 */
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/modules/audit/service";
import { catalogCategories, industries, productTemplates } from "@/modules/catalog/schema";
import { getConfigValue } from "@/modules/config/service";
import type { Actor } from "@/modules/identity/actor";
import { assertPlatformAdmin } from "@/modules/identity/policies";
import { organizations, type Organization } from "@/modules/identity/schema";
import {
  assertCanAssistAssociation,
  assertCanViewAssociation,
  canEditOffering,
  canReviewOffering,
  canSubmitAssociation,
  missingForSubmission,
  reviewRelevantOfferingFields,
  statusOnSubmit,
  type ProfileCompleteness,
} from "./policies";
import {
  associationChannels,
  associationLocations,
  associationOfferings,
  associations,
  industryExclusions,
  type Association,
  type AssociationChannel,
  type AssociationLocation,
  type AssociationOffering,
  type IndustryExclusion,
  type OfferingStatus,
} from "./schema";
import {
  associationIdentitySchema,
  associationProfileSchema,
  channelSchema,
  customOfferingSchema,
  exclusionsSchema,
  locationSchema,
  offeringReviewSchema,
  reviewDecisionSchema,
  standardOfferingSchema,
  type AssociationIdentityInput,
  type AssociationProfileInput,
  type ChannelInput,
  type CustomOfferingInput,
  type ExclusionsInput,
  type LocationInput,
  type OfferingReviewInput,
  type ReviewDecisionInput,
  type StandardOfferingInput,
} from "./validation";

/** Number of onboarding steps (spec section 3). */
export const ONBOARDING_STEPS = 6;

function parse<T>(
  schema: {
    safeParse: (
      v: unknown,
    ) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } };
  },
  input: unknown,
  what: string,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(`Invalid ${what}`, result.error.flatten() as Record<string, unknown>);
  }
  return result.data;
}

async function loadAssociationOrganization(tx: DbOrTx, organizationId: string): Promise<Organization> {
  const organization = await tx.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });
  if (!organization || organization.type !== "association") {
    throw new NotFoundError("association", organizationId);
  }
  return organization;
}

/** Creates the profile row if it does not exist yet and returns it. */
async function ensureProfileRow(tx: DbOrTx, organizationId: string): Promise<Association> {
  await tx.insert(associations).values({ organizationId }).onConflictDoNothing();
  const row = await tx.query.associations.findFirst({
    where: eq(associations.organizationId, organizationId),
  });
  if (!row) throw new NotFoundError("association profile", organizationId);
  return row;
}

async function reachStep(tx: DbOrTx, profile: Association, step: number): Promise<void> {
  if (profile.onboardingStep < step) {
    await tx
      .update(associations)
      .set({ onboardingStep: Math.min(step, ONBOARDING_STEPS) })
      .where(eq(associations.organizationId, profile.organizationId));
  }
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type OfferingRow = AssociationOffering & {
  categoryName: string;
  templateName: string | null;
};

export type ExclusionRow = IndustryExclusion & { industryName: string };

export type AssociationOverview = {
  organization: Organization;
  profile: Association | null;
  channels: AssociationChannel[];
  locations: AssociationLocation[];
  exclusions: ExclusionRow[];
  offerings: OfferingRow[];
  completeness: ProfileCompleteness;
  missing: (keyof ProfileCompleteness)[];
};

/** Everything about one association. Its members and platform admins only. */
export async function getAssociationOverview(
  db: Database,
  actor: Actor,
  organizationId: string,
): Promise<AssociationOverview> {
  assertCanViewAssociation(actor, organizationId);
  const organization = await loadAssociationOrganization(db, organizationId);
  const [profile, channels, locations, exclusions, offerings] = await Promise.all([
    db.query.associations.findFirst({ where: eq(associations.organizationId, organizationId) }),
    db
      .select()
      .from(associationChannels)
      .where(
        and(eq(associationChannels.organizationId, organizationId), isNull(associationChannels.archivedAt)),
      )
      .orderBy(asc(associationChannels.createdAt)),
    db
      .select()
      .from(associationLocations)
      .where(
        and(eq(associationLocations.organizationId, organizationId), isNull(associationLocations.archivedAt)),
      )
      .orderBy(asc(associationLocations.createdAt)),
    db
      .select({ exclusion: industryExclusions, industryName: industries.name })
      .from(industryExclusions)
      .innerJoin(industries, eq(industries.id, industryExclusions.industryId))
      .where(eq(industryExclusions.organizationId, organizationId))
      .orderBy(asc(industries.sortOrder)),
    listOfferingRows(db, organizationId, { includeArchived: false }),
  ]);

  const completeness: ProfileCompleteness = {
    name: organization.name.trim().length >= 2,
    address: Boolean(profile?.addressLine && profile.postalCode && profile.city),
    region: Boolean(profile?.region),
    contact: Boolean(profile?.contactName && profile.contactEmail),
    description: Boolean(profile?.description),
    channelOrLocation: channels.length + locations.length > 0,
    offering: offerings.length > 0,
  };

  return {
    organization,
    profile: profile ?? null,
    channels,
    locations,
    exclusions: exclusions.map((row) => ({ ...row.exclusion, industryName: row.industryName })),
    offerings,
    completeness,
    missing: missingForSubmission(completeness),
  };
}

async function listOfferingRows(
  db: DbOrTx,
  organizationId: string,
  { includeArchived }: { includeArchived: boolean },
): Promise<OfferingRow[]> {
  const rows = await db
    .select({
      offering: associationOfferings,
      categoryName: catalogCategories.name,
      templateName: productTemplates.name,
    })
    .from(associationOfferings)
    .innerJoin(catalogCategories, eq(catalogCategories.id, associationOfferings.categoryId))
    .leftJoin(productTemplates, eq(productTemplates.id, associationOfferings.templateId))
    .where(
      and(
        eq(associationOfferings.organizationId, organizationId),
        includeArchived ? undefined : ne(associationOfferings.status, "archived"),
      ),
    )
    .orderBy(asc(associationOfferings.createdAt));
  return rows.map((row) => ({
    ...row.offering,
    categoryName: row.categoryName,
    templateName: row.templateName,
  }));
}

/** One offering of an association. Members and platform admins only. */
export async function getOffering(db: Database, actor: Actor, offeringId: string): Promise<OfferingRow> {
  const offering = await db.query.associationOfferings.findFirst({
    where: eq(associationOfferings.id, offeringId),
  });
  if (!offering) throw new NotFoundError("offering", offeringId);
  assertCanViewAssociation(actor, offering.organizationId);
  const [row] = (await listOfferingRows(db, offering.organizationId, { includeArchived: true })).filter(
    (r) => r.id === offeringId,
  );
  return row;
}

// ---------------------------------------------------------------------------
// Onboarding steps 1–5 (also used for editing after onboarding)
// ---------------------------------------------------------------------------

/** Step 1: name, CVR, address, region, contact, VAT. */
export async function saveAssociationIdentity(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: AssociationIdentityInput,
): Promise<void> {
  assertCanAssistAssociation(actor, organizationId);
  const { name, ...fields } = parse(associationIdentitySchema, input, "association identity");
  await db.transaction(async (tx) => {
    const organization = await loadAssociationOrganization(tx, organizationId);
    const profile = await ensureProfileRow(tx, organizationId);
    if (organization.name !== name) {
      await tx.update(organizations).set({ name }).where(eq(organizations.id, organizationId));
    }
    await tx.update(associations).set(fields).where(eq(associations.organizationId, organizationId));
    await reachStep(tx, profile, 2);
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "association.identity_saved",
      entityType: "organization",
      entityId: organizationId,
      metadata: { nameChanged: organization.name !== name },
    });
  });
}

/** Step 2: description, activities, members, facilities. */
export async function saveAssociationProfile(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: AssociationProfileInput,
): Promise<void> {
  assertCanAssistAssociation(actor, organizationId);
  const fields = parse(associationProfileSchema, input, "association profile");
  await db.transaction(async (tx) => {
    await loadAssociationOrganization(tx, organizationId);
    const profile = await ensureProfileRow(tx, organizationId);
    await tx.update(associations).set(fields).where(eq(associations.organizationId, organizationId));
    await reachStep(tx, profile, 3);
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "association.profile_saved",
      entityType: "organization",
      entityId: organizationId,
    });
  });
}

/** Marks that the association has moved past a step without other changes (e.g. step 3 → 4). */
export async function completeOnboardingStep(
  db: Database,
  actor: Actor,
  organizationId: string,
  step: number,
): Promise<void> {
  assertCanAssistAssociation(actor, organizationId);
  if (!Number.isInteger(step) || step < 1 || step > ONBOARDING_STEPS) {
    throw new ValidationError(`Invalid step ${step}`);
  }
  await db.transaction(async (tx) => {
    await loadAssociationOrganization(tx, organizationId);
    const profile = await ensureProfileRow(tx, organizationId);
    await reachStep(tx, profile, step + 1);
  });
}

export async function addChannel(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: ChannelInput,
): Promise<AssociationChannel> {
  assertCanAssistAssociation(actor, organizationId);
  const fields = parse(channelSchema, input, "channel");
  return db.transaction(async (tx) => {
    await loadAssociationOrganization(tx, organizationId);
    const [channel] = await tx
      .insert(associationChannels)
      .values({ organizationId, ...fields })
      .returning();
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "association.channel_added",
      entityType: "association_channel",
      entityId: channel.id,
      metadata: {
        kind: fields.kind,
        audienceCount: fields.audienceCount,
        audienceBasis: fields.audienceBasis,
      },
    });
    return channel;
  });
}

async function loadChannel(tx: DbOrTx, channelId: string): Promise<AssociationChannel> {
  const channel = await tx.query.associationChannels.findFirst({
    where: eq(associationChannels.id, channelId),
  });
  if (!channel) throw new NotFoundError("channel", channelId);
  return channel;
}

export async function updateChannel(
  db: Database,
  actor: Actor,
  channelId: string,
  input: ChannelInput,
): Promise<void> {
  const fields = parse(channelSchema, input, "channel");
  await db.transaction(async (tx) => {
    const channel = await loadChannel(tx, channelId);
    assertCanAssistAssociation(actor, channel.organizationId);
    await tx.update(associationChannels).set(fields).where(eq(associationChannels.id, channelId));
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: channel.organizationId,
      action: "association.channel_updated",
      entityType: "association_channel",
      entityId: channelId,
    });
  });
}

/** Channels are archived, not deleted: offerings and campaigns may point to them. */
export async function archiveChannel(db: Database, actor: Actor, channelId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const channel = await loadChannel(tx, channelId);
    assertCanAssistAssociation(actor, channel.organizationId);
    await tx
      .update(associationChannels)
      .set({ archivedAt: new Date() })
      .where(eq(associationChannels.id, channelId));
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: channel.organizationId,
      action: "association.channel_archived",
      entityType: "association_channel",
      entityId: channelId,
    });
  });
}

export async function addLocation(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: LocationInput,
): Promise<AssociationLocation> {
  assertCanAssistAssociation(actor, organizationId);
  const fields = parse(locationSchema, input, "location");
  return db.transaction(async (tx) => {
    await loadAssociationOrganization(tx, organizationId);
    const [location] = await tx
      .insert(associationLocations)
      .values({ organizationId, ...fields })
      .returning();
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "association.location_added",
      entityType: "association_location",
      entityId: location.id,
    });
    return location;
  });
}

export async function archiveLocation(db: Database, actor: Actor, locationId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const location = await tx.query.associationLocations.findFirst({
      where: eq(associationLocations.id, locationId),
    });
    if (!location) throw new NotFoundError("location", locationId);
    assertCanAssistAssociation(actor, location.organizationId);
    await tx
      .update(associationLocations)
      .set({ archivedAt: new Date() })
      .where(eq(associationLocations.id, locationId));
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: location.organizationId,
      action: "association.location_archived",
      entityType: "association_location",
      entityId: locationId,
    });
  });
}

/** Step 5: replaces the set of excluded industries. */
export async function saveIndustryExclusions(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: ExclusionsInput,
): Promise<void> {
  assertCanAssistAssociation(actor, organizationId);
  const { industryIds, expiresOn, note } = parse(exclusionsSchema, input, "exclusions");
  const unique = [...new Set(industryIds)];
  await db.transaction(async (tx) => {
    await loadAssociationOrganization(tx, organizationId);
    const profile = await ensureProfileRow(tx, organizationId);
    if (unique.length > 0) {
      const known = await tx
        .select({ id: industries.id })
        .from(industries)
        .where(inArray(industries.id, unique));
      if (known.length !== unique.length) throw new ValidationError("Unknown industry");
    }
    // Exclusions are preferences, not commercial records, so replacing them is safe.
    await tx.delete(industryExclusions).where(eq(industryExclusions.organizationId, organizationId));
    if (unique.length > 0) {
      await tx.insert(industryExclusions).values(
        unique.map((industryId) => ({
          organizationId,
          industryId,
          expiresOn: expiresOn[industryId] ?? null,
          note: note[industryId] ?? null,
        })),
      );
    }
    await reachStep(tx, profile, 6);
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "association.exclusions_saved",
      entityType: "organization",
      entityId: organizationId,
      metadata: { industryIds: unique },
    });
  });
}

// ---------------------------------------------------------------------------
// Offerings (step 4 and later)
// ---------------------------------------------------------------------------

/**
 * Status for a new or changed offering. While the association is a draft its
 * offerings stay drafts; they are submitted together with the association.
 */
async function initialStatus(
  db: Database,
  associationStatus: Organization["status"],
  input: {
    kind: "standard" | "custom";
    priceMinor: number;
    templateRange?: { minMinor: number; maxMinor: number };
  },
): Promise<OfferingStatus> {
  if (associationStatus === "draft") return "draft";
  const customRequiresApproval = await getConfigValue(db, "catalog.custom_offering_requires_approval");
  return statusOnSubmit({ ...input, customRequiresApproval });
}

async function assertOwnedReference(
  tx: DbOrTx,
  organizationId: string,
  ref: { channelId: string | null; locationId: string | null },
): Promise<void> {
  if (ref.channelId) {
    const channel = await loadChannel(tx, ref.channelId);
    if (channel.organizationId !== organizationId)
      throw new ForbiddenError("channel belongs to another association");
  }
  if (ref.locationId) {
    const location = await tx.query.associationLocations.findFirst({
      where: eq(associationLocations.id, ref.locationId),
    });
    if (!location || location.organizationId !== organizationId) {
      throw new ForbiddenError("location belongs to another association");
    }
  }
}

async function loadActiveTemplate(tx: DbOrTx, templateId: string) {
  const template = await tx.query.productTemplates.findFirst({
    where: eq(productTemplates.id, templateId),
  });
  if (!template || template.archivedAt) throw new NotFoundError("product template", templateId);
  return template;
}

/** Adds an offering based on a platform-standard template. */
export async function createStandardOffering(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: StandardOfferingInput,
): Promise<AssociationOffering> {
  assertCanAssistAssociation(actor, organizationId);
  const fields = parse(standardOfferingSchema, input, "standard offering");
  const organization = await loadAssociationOrganization(db, organizationId);
  const template = await loadActiveTemplate(db, fields.templateId);
  const status = await initialStatus(db, organization.status, {
    kind: "standard",
    priceMinor: fields.priceMinor,
    templateRange: { minMinor: template.priceMinMinor, maxMinor: template.priceMaxMinor },
  });
  return db.transaction(async (tx) => {
    await assertOwnedReference(tx, organizationId, fields);
    const [offering] = await tx
      .insert(associationOfferings)
      .values({
        organizationId,
        kind: "standard",
        categoryId: template.categoryId,
        unit: template.unit,
        evidenceRequirements: template.evidenceRequirements,
        currency: template.currency,
        ...fields,
        status,
        submittedAt: status === "draft" ? null : new Date(),
      })
      .returning();
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "offering.created",
      entityType: "association_offering",
      entityId: offering.id,
      metadata: { kind: "standard", templateId: template.id, priceMinor: fields.priceMinor, status },
    });
    return offering;
  });
}

/** Adds an association-defined product with a price proposal. */
export async function createCustomOffering(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: CustomOfferingInput,
): Promise<AssociationOffering> {
  assertCanAssistAssociation(actor, organizationId);
  const fields = parse(customOfferingSchema, input, "custom offering");
  const organization = await loadAssociationOrganization(db, organizationId);
  const category = await db.query.catalogCategories.findFirst({
    where: eq(catalogCategories.id, fields.categoryId),
  });
  if (!category || category.archivedAt) throw new NotFoundError("category", fields.categoryId);
  const status = await initialStatus(db, organization.status, {
    kind: "custom",
    priceMinor: fields.priceMinor,
  });
  return db.transaction(async (tx) => {
    await assertOwnedReference(tx, organizationId, fields);
    const [offering] = await tx
      .insert(associationOfferings)
      .values({
        organizationId,
        kind: "custom",
        ...fields,
        status,
        submittedAt: status === "draft" ? null : new Date(),
      })
      .returning();
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "offering.created",
      entityType: "association_offering",
      entityId: offering.id,
      metadata: { kind: "custom", priceMinor: fields.priceMinor, status },
    });
    return offering;
  });
}

/**
 * Edits an offering. Changing what is sold or its price on an approved or
 * rejected offering re-runs the submission rule (it may need review again).
 */
export async function updateOffering(
  db: Database,
  actor: Actor,
  offeringId: string,
  input: StandardOfferingInput | CustomOfferingInput,
): Promise<AssociationOffering> {
  const current = await db.query.associationOfferings.findFirst({
    where: eq(associationOfferings.id, offeringId),
  });
  if (!current) throw new NotFoundError("offering", offeringId);
  assertCanAssistAssociation(actor, current.organizationId);
  if (!canEditOffering(current.status)) throw new ConflictError("archived offerings cannot be edited");
  const organization = await loadAssociationOrganization(db, current.organizationId);

  let changes: Partial<AssociationOffering>;
  let templateRange: { minMinor: number; maxMinor: number } | undefined;
  if (current.kind === "standard") {
    const fields = parse(
      standardOfferingSchema,
      { ...input, templateId: current.templateId },
      "standard offering",
    );
    const template = await loadActiveTemplate(db, fields.templateId);
    templateRange = { minMinor: template.priceMinMinor, maxMinor: template.priceMaxMinor };
    // The template of an existing offering never changes.
    const rest: Partial<typeof fields> = { ...fields };
    delete rest.templateId;
    changes = rest;
  } else {
    changes = parse(customOfferingSchema, input, "custom offering");
  }

  const relevantChange = reviewRelevantOfferingFields.some(
    (field) => field in changes && changes[field] !== current[field],
  );
  let status = current.status;
  if (organization.status === "draft") status = "draft";
  else if (relevantChange || current.status === "rejected" || current.status === "draft") {
    status = await initialStatus(db, organization.status, {
      kind: current.kind,
      priceMinor: changes.priceMinor ?? current.priceMinor,
      templateRange,
    });
  }

  return db.transaction(async (tx) => {
    await assertOwnedReference(tx, current.organizationId, {
      channelId: changes.channelId ?? null,
      locationId: changes.locationId ?? null,
    });
    const [updated] = await tx
      .update(associationOfferings)
      .set({
        ...changes,
        status,
        submittedAt: status === current.status ? current.submittedAt : status === "draft" ? null : new Date(),
        reviewNote: status === current.status ? current.reviewNote : null,
      })
      .where(eq(associationOfferings.id, offeringId))
      .returning();
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: current.organizationId,
      action: "offering.updated",
      entityType: "association_offering",
      entityId: offeringId,
      metadata: {
        from: { priceMinor: current.priceMinor, status: current.status },
        to: { priceMinor: updated.priceMinor, status: updated.status },
      },
    });
    return updated;
  });
}

/** Withdraws an offering. Archived offerings are kept for history. */
export async function archiveOffering(db: Database, actor: Actor, offeringId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await tx.query.associationOfferings.findFirst({
      where: eq(associationOfferings.id, offeringId),
    });
    if (!current) throw new NotFoundError("offering", offeringId);
    assertCanAssistAssociation(actor, current.organizationId);
    await tx
      .update(associationOfferings)
      .set({ status: "archived" })
      .where(eq(associationOfferings.id, offeringId));
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: current.organizationId,
      action: "offering.archived",
      entityType: "association_offering",
      entityId: offeringId,
      metadata: { from: current.status },
    });
  });
}

// ---------------------------------------------------------------------------
// Submission and review
// ---------------------------------------------------------------------------

/**
 * Step 6: sends the association (and its draft offerings) for review. Fails
 * with the list of missing items when the profile is incomplete.
 */
export async function submitAssociationForReview(
  db: Database,
  actor: Actor,
  organizationId: string,
): Promise<void> {
  assertCanAssistAssociation(actor, organizationId);
  const overview = await getAssociationOverview(db, actor, organizationId);
  if (!canSubmitAssociation(overview.organization.status)) {
    throw new ConflictError(`association is ${overview.organization.status}, not draft`);
  }
  if (overview.missing.length > 0) {
    throw new ValidationError("Profile incomplete", { missing: overview.missing });
  }
  const customRequiresApproval = await getConfigValue(db, "catalog.custom_offering_requires_approval");
  const templates = await db.select().from(productTemplates);
  const rangeFor = new Map(
    templates.map((t) => [t.id, { minMinor: t.priceMinMinor, maxMinor: t.priceMaxMinor }]),
  );

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(organizations)
      .set({ status: "pending_review" })
      .where(eq(organizations.id, organizationId));
    await tx
      .update(associations)
      .set({ submittedAt: now, reviewNote: null })
      .where(eq(associations.organizationId, organizationId));
    for (const offering of overview.offerings.filter((o) => o.status === "draft")) {
      const status = statusOnSubmit({
        kind: offering.kind,
        priceMinor: offering.priceMinor,
        templateRange: offering.templateId ? rangeFor.get(offering.templateId) : undefined,
        customRequiresApproval,
      });
      await tx
        .update(associationOfferings)
        .set({ status, submittedAt: now })
        .where(eq(associationOfferings.id, offering.id));
    }
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organizationId,
      action: "association.submitted",
      entityType: "organization",
      entityId: organizationId,
      metadata: { offerings: overview.offerings.length },
    });
  });
}

/** Admin activates an association, or returns it to draft with a note. */
export async function reviewAssociation(
  db: Database,
  actor: Actor,
  organizationId: string,
  input: ReviewDecisionInput,
): Promise<void> {
  assertPlatformAdmin(actor);
  const { decision, note } = parse(reviewDecisionSchema, input, "review decision");
  if (decision === "reject" && !note) {
    throw new ValidationError("A note is required when returning an association", { note: ["required"] });
  }
  await db.transaction(async (tx) => {
    const organization = await loadAssociationOrganization(tx, organizationId);
    if (organization.status !== "pending_review") {
      throw new ConflictError(`association is ${organization.status}, not pending_review`);
    }
    const status = decision === "approve" ? "active" : "draft";
    await tx.update(organizations).set({ status }).where(eq(organizations.id, organizationId));
    await tx
      .update(associations)
      .set({ reviewedAt: new Date(), reviewNote: note })
      .where(eq(associations.organizationId, organizationId));
    await recordAuditEvent(tx, {
      actor,
      action: decision === "approve" ? "association.approved" : "association.returned",
      entityType: "organization",
      entityId: organizationId,
      metadata: { from: organization.status, to: status, note },
    });
  });
}

/** Admin approves (optionally with a corrected price) or rejects an offering. */
export async function reviewOffering(
  db: Database,
  actor: Actor,
  offeringId: string,
  input: OfferingReviewInput,
): Promise<void> {
  assertPlatformAdmin(actor);
  const { decision, note, priceMinor } = parse(offeringReviewSchema, input, "offering review");
  if (decision === "reject" && !note) {
    throw new ValidationError("A note is required when rejecting an offering", { note: ["required"] });
  }
  await db.transaction(async (tx) => {
    const current = await tx.query.associationOfferings.findFirst({
      where: eq(associationOfferings.id, offeringId),
    });
    if (!current) throw new NotFoundError("offering", offeringId);
    if (!canReviewOffering(current.status)) {
      throw new ConflictError(`offering is ${current.status}, not pending_review`);
    }
    const status = decision === "approve" ? "approved" : "rejected";
    const newPrice = decision === "approve" && priceMinor !== undefined ? priceMinor : current.priceMinor;
    await tx
      .update(associationOfferings)
      .set({
        status,
        priceMinor: newPrice,
        reviewedAt: new Date(),
        reviewedByUserId: actor.userId,
        reviewNote: note,
      })
      .where(eq(associationOfferings.id, offeringId));
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: null,
      action: decision === "approve" ? "offering.approved" : "offering.rejected",
      entityType: "association_offering",
      entityId: offeringId,
      metadata: {
        organizationId: current.organizationId,
        note,
        ...(newPrice !== current.priceMinor
          ? { priceOverride: { from: current.priceMinor, to: newPrice } }
          : {}),
      },
    });
  });
}

export type ReviewQueue = {
  associations: { id: string; name: string; submittedAt: Date | null; isDemo: boolean }[];
  offerings: (OfferingRow & { organizationName: string })[];
};

/** Associations and offerings waiting for an admin. Platform admins only. */
export async function listReviewQueue(db: Database, actor: Actor): Promise<ReviewQueue> {
  assertPlatformAdmin(actor);
  const pendingAssociations = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      submittedAt: associations.submittedAt,
      isDemo: organizations.isDemo,
    })
    .from(organizations)
    .leftJoin(associations, eq(associations.organizationId, organizations.id))
    .where(and(eq(organizations.type, "association"), eq(organizations.status, "pending_review")))
    .orderBy(asc(associations.submittedAt));

  const rows = await db
    .select({
      offering: associationOfferings,
      categoryName: catalogCategories.name,
      templateName: productTemplates.name,
      organizationName: organizations.name,
    })
    .from(associationOfferings)
    .innerJoin(organizations, eq(organizations.id, associationOfferings.organizationId))
    .innerJoin(catalogCategories, eq(catalogCategories.id, associationOfferings.categoryId))
    .leftJoin(productTemplates, eq(productTemplates.id, associationOfferings.templateId))
    .where(eq(associationOfferings.status, "pending_review"))
    .orderBy(asc(associationOfferings.submittedAt));

  return {
    associations: pendingAssociations,
    offerings: rows.map((row) => ({
      ...row.offering,
      categoryName: row.categoryName,
      templateName: row.templateName,
      organizationName: row.organizationName,
    })),
  };
}

export type PublishedOffering = OfferingRow & {
  organizationName: string;
  city: string | null;
  region: Association["region"];
};

/**
 * Offerings companies can buy: approved offerings of active associations.
 * Any signed-in user may read them (the marketplace catalogue, used from M2).
 */
export async function listPublishedOfferings(
  db: Database,
  _actor: Actor,
  { organizationId }: { organizationId?: string } = {},
): Promise<PublishedOffering[]> {
  const rows = await db
    .select({
      offering: associationOfferings,
      categoryName: catalogCategories.name,
      templateName: productTemplates.name,
      organizationName: organizations.name,
      city: associations.city,
      region: associations.region,
    })
    .from(associationOfferings)
    .innerJoin(organizations, eq(organizations.id, associationOfferings.organizationId))
    .innerJoin(catalogCategories, eq(catalogCategories.id, associationOfferings.categoryId))
    .leftJoin(productTemplates, eq(productTemplates.id, associationOfferings.templateId))
    .leftJoin(associations, eq(associations.organizationId, organizations.id))
    .where(
      and(
        eq(associationOfferings.status, "approved"),
        eq(organizations.status, "active"),
        isNull(organizations.archivedAt),
        organizationId ? eq(organizations.id, organizationId) : undefined,
      ),
    )
    .orderBy(asc(organizations.name), desc(associationOfferings.createdAt));
  return rows.map((row) => ({
    ...row.offering,
    categoryName: row.categoryName,
    templateName: row.templateName,
    organizationName: row.organizationName,
    city: row.city,
    region: row.region,
  }));
}
