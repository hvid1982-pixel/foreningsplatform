/**
 * Append-only audit trail of consequential actions (spec sections 2, 10, 14).
 * Rows are never updated or deleted by the application.
 */
import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "@/modules/identity/schema";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    /**
     * Null for system actions (seed scripts, scheduled jobs). The foreign key
     * restricts deletes: users and organizations are anonymised or archived,
     * never hard-deleted, so the trail stays intact.
     */
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
    /** The organization the actor acted on behalf of, if any. */
    actorOrganizationId: uuid("actor_organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    /** Dotted verb, e.g. `organization.created`, `config.value_set`. */
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    /** Free-form structured details (before/after values etc.). No secrets. */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    index("audit_events_entity_idx").on(t.entityType, t.entityId),
    index("audit_events_actor_idx").on(t.actorUserId),
    index("audit_events_occurred_at_idx").on(t.occurredAt),
  ],
);

export type AuditEvent = typeof auditEvents.$inferSelect;
