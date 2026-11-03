/**
 * Identity tables: users, sessions and credentials (managed by Better Auth),
 * plus organizations and memberships (managed by this application).
 *
 * The Better Auth tables follow the library's expected shape. If you change
 * them, keep them compatible with Better Auth's core schema; the library
 * validates the schema on start-up and logs mismatches.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// Better Auth core tables
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    /** Password hash (scrypt) for e-mail/password accounts. Never exposed. */
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/** Rate-limit counters for auth endpoints (shared across serverless instances). */
export const rateLimits = pgTable("rate_limits", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ---------------------------------------------------------------------------
// Organizations and memberships
// ---------------------------------------------------------------------------

/**
 * The kind of tenant. `platform` is the single organization whose admins
 * operate the marketplace.
 */
export const organizationType = pgEnum("organization_type", ["association", "company", "platform"]);

/**
 * Lifecycle of an organization. New associations start as `draft` and are
 * activated after review in Milestone 1.
 */
export const organizationStatus = pgEnum("organization_status", [
  "draft",
  "pending_review",
  "active",
  "suspended",
  "archived",
]);

/**
 * Role inside one organization. MVP uses `admin` only; `member` is reserved for
 * future collaborators (spec section 2) and grants no write access yet.
 */
export const membershipRole = pgEnum("membership_role", ["admin", "member"]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    type: organizationType("type").notNull(),
    name: text("name").notNull(),
    status: organizationStatus("status").notNull().default("draft"),
    /** True for seeded demo data, so it can never be mistaken for real inventory. */
    isDemo: boolean("is_demo").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("organizations_type_idx").on(t.type),
    // Exactly one platform organization may exist.
    uniqueIndex("organizations_single_platform_idx")
      .on(t.type)
      .where(sql`${t.type} = 'platform'`),
  ],
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    role: membershipRole("role").notNull().default("admin"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_user_org_idx").on(t.userId, t.organizationId),
    index("memberships_org_idx").on(t.organizationId),
  ],
);

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationType = (typeof organizationType.enumValues)[number];
export type OrganizationStatus = (typeof organizationStatus.enumValues)[number];
export type MembershipRole = (typeof membershipRole.enumValues)[number];
export type Membership = typeof organizationMemberships.$inferSelect;
