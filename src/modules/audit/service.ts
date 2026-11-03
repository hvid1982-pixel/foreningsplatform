/**
 * Writing and reading the audit trail. Call `recordAuditEvent` inside the same
 * transaction as the change it describes, so the change and its audit row are
 * committed (or rolled back) together.
 */
import { desc, eq } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import type { Actor } from "@/modules/identity/actor";
import { assertPlatformAdmin } from "@/modules/identity/policies";
import { users } from "@/modules/identity/schema";
import { auditEvents } from "./schema";

export type AuditInput = {
  /** Null for system actions. */
  actor: Pick<Actor, "userId"> | null;
  actorOrganizationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(tx: DbOrTx, input: AuditInput): Promise<void> {
  await tx.insert(auditEvents).values({
    actorUserId: input.actor?.userId ?? null,
    actorOrganizationId: input.actorOrganizationId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export type AuditEventRow = {
  id: string;
  occurredAt: Date;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown>;
};

/** Latest audit events, newest first. Platform admins only. */
export async function listAuditEvents(
  db: Database,
  actor: Actor,
  { limit = 100 }: { limit?: number } = {},
): Promise<AuditEventRow[]> {
  assertPlatformAdmin(actor);
  return db
    .select({
      id: auditEvents.id,
      occurredAt: auditEvents.occurredAt,
      action: auditEvents.action,
      entityType: auditEvents.entityType,
      entityId: auditEvents.entityId,
      actorEmail: users.email,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorUserId))
    .orderBy(desc(auditEvents.occurredAt))
    .limit(Math.min(limit, 500));
}
