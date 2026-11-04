/**
 * Supply side (spec sections 3 and 4): an association's profile, channels,
 * physical locations, excluded industries and the offerings it sells.
 *
 * Every table is keyed to an `organizations` row of type `association`.
 * Rows are archived (`archived_at` / status `archived`), never deleted, so
 * that campaigns referencing them stay intact.
 */
import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { catalogCategories, industries, productTemplates } from "@/modules/catalog/schema";
import { organizations, users } from "@/modules/identity/schema";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** The five Danish regions. Used for search and matching. */
export const danishRegion = pgEnum("danish_region", [
  "hovedstaden",
  "sjaelland",
  "syddanmark",
  "midtjylland",
  "nordjylland",
]);

/**
 * One row per association organization: identity and profile (onboarding
 * steps 1–2) plus onboarding progress and review state.
 */
export const associations = pgTable("associations", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "restrict" }),
  cvr: text("cvr"),
  /** Free text kind, e.g. "Idrætsforening", "Spejdergruppe". */
  associationKind: text("association_kind"),
  addressLine: text("address_line"),
  postalCode: text("postal_code"),
  city: text("city"),
  municipality: text("municipality"),
  region: danishRegion("region"),
  /** Filled by geocoding in a later milestone; nullable until then. */
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  description: text("description"),
  activities: text("activities"),
  /** Optional, self-reported. */
  memberCount: integer("member_count"),
  /** Aggregated age bands, e.g. ["0-12", "13-18"]. Never individual data. */
  memberAgeBands: text("member_age_bands")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  facilities: text("facilities"),
  /** Explicit VAT treatment: true = prices are excl. 25 % moms; null = not stated. */
  vatRegistered: boolean("vat_registered"),
  /** Furthest onboarding step the association has saved (1–6). */
  onboardingStep: integer("onboarding_step").notNull().default(1),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  ...timestamps,
});

export const channelKind = pgEnum("channel_kind", [
  "website",
  "facebook",
  "instagram",
  "tiktok",
  "linkedin",
  "youtube",
  "newsletter",
  "other",
]);

/**
 * `stated`: the association's own count of followers/subscribers (audience).
 * `measured`: verified reach from platform statistics. Spec section 3 requires
 * the two to be kept apart.
 */
export const audienceBasis = pgEnum("audience_basis", ["stated", "measured"]);

export const associationChannels = pgTable(
  "association_channels",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    kind: channelKind("kind").notNull(),
    name: text("name"),
    url: text("url"),
    audienceCount: integer("audience_count"),
    audienceBasis: audienceBasis("audience_basis").notNull().default("stated"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("association_channels_org_idx").on(t.organizationId)],
);

export const locationKind = pgEnum("location_kind", ["clubhouse", "field", "hall", "event_venue", "other"]);

export const associationLocations = pgTable(
  "association_locations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    kind: locationKind("kind").notNull(),
    name: text("name").notNull(),
    addressLine: text("address_line"),
    postalCode: text("postal_code"),
    city: text("city"),
    description: text("description"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("association_locations_org_idx").on(t.organizationId)],
);

/** Advertiser industries an association does not want as sponsors. */
export const industryExclusions = pgTable(
  "industry_exclusions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    industryId: uuid("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "restrict" }),
    note: text("note"),
    /** Optional: e.g. an exclusive sponsor deal that ends on this date. */
    expiresOn: date("expires_on"),
    ...timestamps,
  },
  (t) => [uniqueIndex("industry_exclusions_org_industry_idx").on(t.organizationId, t.industryId)],
);

export const offeringKind = pgEnum("offering_kind", ["standard", "custom"]);

/**
 * `draft` → `pending_review` → `approved` | `rejected`; any → `archived`.
 * Only `approved` offerings of `active` associations are visible to companies.
 */
export const offeringStatus = pgEnum("offering_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "archived",
]);

/**
 * A sellable product of one association: either based on a platform-standard
 * template or a custom definition. Prices are integer øre excluding VAT; the
 * association's VAT treatment is on `associations.vat_registered`.
 * Confirmed campaigns (M4) snapshot the offering, so later edits here never
 * change agreed terms.
 */
export const associationOfferings = pgTable(
  "association_offerings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    kind: offeringKind("kind").notNull(),
    templateId: uuid("template_id").references(() => productTemplates.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => catalogCategories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    unit: text("unit").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: text("currency").notNull().default("DKK"),
    /** How many units the association can deliver in the availability period. */
    capacity: integer("capacity"),
    availableFrom: date("available_from"),
    availableTo: date("available_to"),
    availabilityNote: text("availability_note"),
    evidenceRequirements: text("evidence_requirements"),
    channelId: uuid("channel_id").references(() => associationChannels.id, { onDelete: "restrict" }),
    locationId: uuid("location_id").references(() => associationLocations.id, { onDelete: "restrict" }),
    status: offeringStatus("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "restrict" }),
    reviewNote: text("review_note"),
    ...timestamps,
  },
  (t) => [
    index("association_offerings_org_idx").on(t.organizationId),
    index("association_offerings_status_idx").on(t.status),
    check("association_offerings_price_check", sql`${t.priceMinor} >= 0`),
    check("association_offerings_capacity_check", sql`${t.capacity} IS NULL OR ${t.capacity} > 0`),
    check(
      "association_offerings_standard_has_template_check",
      sql`${t.kind} <> 'standard' OR ${t.templateId} IS NOT NULL`,
    ),
    check(
      "association_offerings_period_check",
      sql`${t.availableFrom} IS NULL OR ${t.availableTo} IS NULL OR ${t.availableFrom} <= ${t.availableTo}`,
    ),
  ],
);

export type Association = typeof associations.$inferSelect;
export type DanishRegion = (typeof danishRegion.enumValues)[number];
export type AssociationChannel = typeof associationChannels.$inferSelect;
export type ChannelKind = (typeof channelKind.enumValues)[number];
export type AudienceBasis = (typeof audienceBasis.enumValues)[number];
export type AssociationLocation = typeof associationLocations.$inferSelect;
export type LocationKind = (typeof locationKind.enumValues)[number];
export type IndustryExclusion = typeof industryExclusions.$inferSelect;
export type AssociationOffering = typeof associationOfferings.$inferSelect;
export type OfferingKind = (typeof offeringKind.enumValues)[number];
export type OfferingStatus = (typeof offeringStatus.enumValues)[number];
