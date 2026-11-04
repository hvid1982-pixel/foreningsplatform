import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { auditEvents } from "@/modules/audit/schema";
import { associationOfferings } from "@/modules/associations/schema";
import {
  addChannel,
  createCustomOffering,
  createStandardOffering,
  getAssociationOverview,
  listPublishedOfferings,
  listReviewQueue,
  reviewAssociation,
  reviewOffering,
  saveAssociationIdentity,
  saveAssociationProfile,
  saveIndustryExclusions,
  submitAssociationForReview,
  updateOffering,
} from "@/modules/associations/service";
import {
  ensureInitialCatalog,
  listActiveCategories,
  listActiveIndustries,
  listProductTemplates,
} from "@/modules/catalog/service";
import { setConfigValue } from "@/modules/config/service";
import type { Actor } from "@/modules/identity/actor";
import { organizations } from "@/modules/identity/schema";
import { createOrgWithAdmin, createPlatformAdmin, resetDatabase } from "../support/db";

const identity = {
  name: "Klub Øst",
  cvr: "12345678",
  associationKind: "Håndbold",
  addressLine: "Hallvej 2",
  postalCode: "8000",
  city: "Aarhus",
  municipality: "Aarhus",
  region: "midtjylland" as const,
  contactName: "Formand Østergaard",
  contactEmail: "formand@example.com",
  contactPhone: null,
  vatRegistered: false,
};

const profile = {
  description: "Håndboldklub for alle aldre.",
  activities: null,
  memberCount: 250,
  memberAgeBands: ["13-18" as const],
  facilities: null,
};

async function template(slug: string) {
  const all = await listProductTemplates(db);
  const found = all.find((t) => t.slug === slug);
  if (!found) throw new Error(`missing template ${slug}`);
  return found;
}

async function onboardedDraft(): Promise<{ actor: Actor; organizationId: string }> {
  const association = await createOrgWithAdmin("association", "Klub", "draft");
  await saveAssociationIdentity(db, association.actor, association.organizationId, identity);
  await saveAssociationProfile(db, association.actor, association.organizationId, profile);
  await addChannel(db, association.actor, association.organizationId, {
    kind: "instagram",
    name: null,
    url: "instagram.com/klub",
    audienceCount: 900,
    audienceBasis: "stated",
  });
  return association;
}

function offeringInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Opslag",
    description: "Et opslag om jer",
    priceMinor: 75_000,
    capacity: 4,
    availableFrom: null,
    availableTo: null,
    availabilityNote: null,
    channelId: null,
    locationId: null,
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDatabase();
  await ensureInitialCatalog(db);
});

describe("association onboarding and publication", () => {
  it("a new association can register, submit, be approved and publish offerings without developer help", async () => {
    const admin = await createPlatformAdmin();
    const { actor, organizationId } = await onboardedDraft();
    const social = await template("social_post");
    const [category] = await listActiveCategories(db);

    const standard = await createStandardOffering(db, actor, organizationId, {
      templateId: social.id,
      ...offeringInput({ priceMinor: social.suggestedPriceMinor }),
    });
    const custom = await createCustomOffering(db, actor, organizationId, {
      categoryId: category.id,
      unit: "stævne",
      evidenceRequirements: "Fotos fra dagen",
      ...offeringInput({ title: "Navnesponsor", priceMinor: 500_000 }),
    });
    // While the association is a draft, its offerings are drafts too.
    expect(standard.status).toBe("draft");
    expect(custom.status).toBe("draft");
    expect(standard.unit).toBe(social.unit);

    await submitAssociationForReview(db, actor, organizationId);
    const queue = await listReviewQueue(db, admin);
    expect(queue.associations.map((a) => a.id)).toEqual([organizationId]);
    // Standard product inside the price range is approved directly; custom waits for admin.
    expect(queue.offerings.map((o) => o.id)).toEqual([custom.id]);

    expect(await listPublishedOfferings(db, actor)).toEqual([]);

    await reviewAssociation(db, admin, organizationId, { decision: "approve", note: null });
    await reviewOffering(db, admin, custom.id, { decision: "approve", note: null, priceMinor: 450_000 });

    const published = await listPublishedOfferings(db, actor);
    expect(published.map((o) => [o.title, o.priceMinor])).toEqual(
      expect.arrayContaining([
        ["Opslag", social.suggestedPriceMinor],
        ["Navnesponsor", 450_000],
      ]),
    );
    expect(published.every((o) => o.organizationName === "Klub Øst" && o.region === "midtjylland")).toBe(
      true,
    );

    const [approval] = await db.select().from(auditEvents).where(eq(auditEvents.action, "offering.approved"));
    expect(approval.metadata).toMatchObject({ priceOverride: { from: 500_000, to: 450_000 } });
  });

  it("cannot submit an incomplete profile and reports what is missing", async () => {
    const { actor, organizationId } = await createOrgWithAdmin("association", "Tom", "draft");
    await expect(submitAssociationForReview(db, actor, organizationId)).rejects.toMatchObject({
      code: "validation",
      details: {
        missing: expect.arrayContaining(["address", "region", "contact", "description", "offering"]),
      },
    });
  });

  it("a standard offering priced outside the template range needs review", async () => {
    const { actor, organizationId } = await createOrgWithAdmin("association", "Aktiv klub", "active");
    const social = await template("social_post");
    const offering = await createStandardOffering(db, actor, organizationId, {
      templateId: social.id,
      ...offeringInput({ priceMinor: social.priceMaxMinor + 100 }),
    });
    expect(offering.status).toBe("pending_review");
    const inRange = await createStandardOffering(db, actor, organizationId, {
      templateId: social.id,
      ...offeringInput({ priceMinor: social.priceMinMinor }),
    });
    expect(inRange.status).toBe("approved");
  });

  it("changing the price of an approved custom offering sends it back to review", async () => {
    const admin = await createPlatformAdmin();
    const { actor, organizationId } = await createOrgWithAdmin("association", "Aktiv klub", "active");
    const [category] = await listActiveCategories(db);
    const input = {
      categoryId: category.id,
      unit: "stk.",
      evidenceRequirements: "Foto",
      ...offeringInput({ priceMinor: 100_000 }),
    };
    const offering = await createCustomOffering(db, actor, organizationId, input);
    await reviewOffering(db, admin, offering.id, { decision: "approve", note: null });
    expect((await listPublishedOfferings(db, actor)).map((o) => o.id)).toEqual([offering.id]);

    const unchanged = await updateOffering(db, actor, offering.id, {
      ...input,
      availabilityNote: "Kun i weekender",
    });
    expect(unchanged.status).toBe("approved");

    const repriced = await updateOffering(db, actor, offering.id, { ...input, priceMinor: 200_000 });
    expect(repriced.status).toBe("pending_review");
    expect(await listPublishedOfferings(db, actor)).toEqual([]);
  });

  it("custom offerings are approved directly when the approval rule is turned off", async () => {
    const admin = await createPlatformAdmin();
    await setConfigValue(db, admin, {
      key: "catalog.custom_offering_requires_approval",
      value: false,
      status: "approved",
    });
    const { actor, organizationId } = await createOrgWithAdmin("association", "Aktiv klub", "active");
    const [category] = await listActiveCategories(db);
    const offering = await createCustomOffering(db, actor, organizationId, {
      categoryId: category.id,
      unit: "stk.",
      evidenceRequirements: "Foto",
      ...offeringInput(),
    });
    expect(offering.status).toBe("approved");
  });

  it("returning an association requires a note and puts it back to draft", async () => {
    const admin = await createPlatformAdmin();
    const { actor, organizationId } = await onboardedDraft();
    const social = await template("social_post");
    await createStandardOffering(db, actor, organizationId, {
      templateId: social.id,
      ...offeringInput({ priceMinor: social.suggestedPriceMinor }),
    });
    await submitAssociationForReview(db, actor, organizationId);
    await expect(
      reviewAssociation(db, admin, organizationId, { decision: "reject", note: null }),
    ).rejects.toMatchObject({ code: "validation" });
    await reviewAssociation(db, admin, organizationId, {
      decision: "reject",
      note: "Tilføj en adresse på banen",
    });
    const overview = await getAssociationOverview(db, actor, organizationId);
    expect(overview.organization.status).toBe("draft");
    expect(overview.profile?.reviewNote).toBe("Tilføj en adresse på banen");
  });

  it("saves and replaces industry exclusions", async () => {
    const { actor, organizationId } = await onboardedDraft();
    const [alcohol, gambling] = await listActiveIndustries(db);
    await saveIndustryExclusions(db, actor, organizationId, {
      industryIds: [alcohol.id, gambling.id],
      expiresOn: { [gambling.id]: "2027-06-30" },
      note: {},
    });
    await saveIndustryExclusions(db, actor, organizationId, {
      industryIds: [gambling.id],
      expiresOn: {},
      note: {},
    });
    const overview = await getAssociationOverview(db, actor, organizationId);
    expect(overview.exclusions.map((e) => e.industryName)).toEqual([gambling.name]);
    expect(overview.profile?.onboardingStep).toBe(6);
  });
});

describe("supply access control", () => {
  it("an association cannot read or change another association", async () => {
    const a = await onboardedDraft();
    const b = await createOrgWithAdmin("association", "Klub B", "draft");
    await expect(getAssociationOverview(db, b.actor, a.organizationId)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(saveAssociationProfile(db, b.actor, a.organizationId, profile)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(submitAssociationForReview(db, b.actor, a.organizationId)).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("a company cannot edit an association", async () => {
    const a = await onboardedDraft();
    const company = await createOrgWithAdmin("company", "Firma");
    await expect(
      saveAssociationIdentity(db, company.actor, a.organizationId, identity),
    ).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("an offering cannot point to another association's channel", async () => {
    const a = await onboardedDraft();
    const b = await createOrgWithAdmin("association", "Klub B", "active");
    const [channel] = (await getAssociationOverview(db, a.actor, a.organizationId)).channels;
    const social = await template("social_post");
    await expect(
      createStandardOffering(db, b.actor, b.organizationId, {
        templateId: social.id,
        ...offeringInput({ channelId: channel.id }),
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("only platform admins can review", async () => {
    const { actor, organizationId } = await onboardedDraft();
    const social = await template("social_post");
    const offering = await createStandardOffering(db, actor, organizationId, {
      templateId: social.id,
      ...offeringInput({ priceMinor: social.suggestedPriceMinor }),
    });
    await submitAssociationForReview(db, actor, organizationId);
    await expect(
      reviewAssociation(db, actor, organizationId, { decision: "approve", note: null }),
    ).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      reviewOffering(db, actor, offering.id, { decision: "approve", note: null }),
    ).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(listReviewQueue(db, actor)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("a platform admin can assist an association and the change is audited with the admin as actor", async () => {
    const admin = await createPlatformAdmin();
    const { organizationId } = await onboardedDraft();
    await saveAssociationProfile(db, admin, organizationId, { ...profile, description: "Rettet af admin" });
    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.action, "association.profile_saved"));
    expect(events.at(-1)?.actorUserId).toBe(admin.userId);
  });

  it("archived and suspended associations' offerings are not published", async () => {
    const { actor, organizationId } = await createOrgWithAdmin("association", "Aktiv klub", "active");
    const social = await template("social_post");
    await createStandardOffering(db, actor, organizationId, {
      templateId: social.id,
      ...offeringInput({ priceMinor: social.suggestedPriceMinor }),
    });
    expect(await listPublishedOfferings(db, actor)).toHaveLength(1);
    await db.update(organizations).set({ status: "suspended" }).where(eq(organizations.id, organizationId));
    expect(await listPublishedOfferings(db, actor)).toHaveLength(0);
    const rows = await db.select().from(associationOfferings);
    expect(rows).toHaveLength(1);
  });
});
