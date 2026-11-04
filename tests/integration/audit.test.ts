import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { auditEvents } from "@/modules/audit/schema";
import { listAuditEvents, recordAuditEvent } from "@/modules/audit/service";
import { createPlatformAdmin, resetDatabase } from "../support/db";

beforeEach(resetDatabase);

describe("audit trail", () => {
  it("is append-only at the database level", async () => {
    await recordAuditEvent(db, { actor: null, action: "test.event", entityType: "test" });
    await expect(db.update(auditEvents).set({ action: "tampered" })).rejects.toThrow();
    await expect(db.delete(auditEvents)).rejects.toThrow();
    const {
      rows: [{ count }],
    } = await db.execute<{ count: string }>(sql`select count(*) from audit_events`);
    expect(Number(count)).toBe(1);
  });

  it("lists newest first with the actor's e-mail", async () => {
    const admin = await createPlatformAdmin();
    await recordAuditEvent(db, { actor: null, action: "first", entityType: "test" });
    await recordAuditEvent(db, { actor: admin, action: "second", entityType: "test" });
    const events = await listAuditEvents(db, admin);
    expect(events.map((e) => e.action)).toEqual(["second", "first"]);
    expect(events[0].actorEmail).toBe(admin.email);
    expect(events[1].actorEmail).toBeNull();
  });
});
