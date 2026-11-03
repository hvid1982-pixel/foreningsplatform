/**
 * Versioned business configuration (spec sections 0.2, 13, 17).
 *
 * Each change inserts a new version row; old versions are kept so it is always
 * possible to see which rule applied when. The highest version per key is the
 * current value.
 */
import { sql } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/schema";

/**
 * `proposed_default`: a reversible default from the spec that the founder has
 * not approved yet. Shown as "ikke endeligt godkendt" in admin.
 * `approved`: explicitly confirmed by a platform admin.
 */
export const configurationStatus = pgEnum("configuration_status", ["proposed_default", "approved"]);

export const configurationVersions = pgTable(
  "configuration_versions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    key: text("key").notNull(),
    version: integer("version").notNull(),
    /** SQL NULL means "not determined" (e.g. an open business decision). */
    value: jsonb("value").$type<unknown>(),
    status: configurationStatus("status").notNull(),
    note: text("note"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("configuration_versions_key_version_idx").on(t.key, t.version)],
);

export type ConfigurationVersion = typeof configurationVersions.$inferSelect;
export type ConfigurationStatus = (typeof configurationStatus.enumValues)[number];
