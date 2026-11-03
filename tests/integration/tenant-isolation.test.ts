import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { auditEvents } from "@/modules/audit/schema";
import { listAuditEvents } from "@/modules/audit/service";
import {
  createOrganization,
  getOrganization,
  listOrganizations,
  loadActor,
  setOrganizationStatus,
} from "@/modules/identity/service";
import {
  actorWithoutOrganization,
  createOrgWithAdmin,
  createPlatformAdmin,
  resetDatabase,
} from "../support/db";

beforeEach(resetDatabase);

describe("tenant isolation", () => {
  it("an association admin can read their own organization", async () => {
    const { actor, organizationId } = await createOrgWithAdmin("association", "Klub A");
    await expect(getOrganization(db, actor, organizationId)).resolves.toMatchObject({ name: "Klub A" });
  });

  it("an association admin cannot read another association or a company", async () => {
    const a = await createOrgWithAdmin("association", "Klub A");
    const b = await createOrgWithAdmin("association", "Klub B");
    const c = await createOrgWithAdmin("company", "Firma C");
    await expect(getOrganization(db, a.actor, b.organizationId)).rejects.toMatchObject({ code: "forbidden" });
    await expect(getOrganization(db, a.actor, c.organizationId)).rejects.toMatchObject({ code: "forbidden" });
    await expect(getOrganization(db, c.actor, a.organizationId)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("a user without memberships can read no organization", async () => {
    const outsider = await actorWithoutOrganization();
    const a = await createOrgWithAdmin("association");
    await expect(getOrganization(db, outsider, a.organizationId)).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("archived organizations no longer grant access", async () => {
    const admin = await createPlatformAdmin();
    const a = await createOrgWithAdmin("association");
    await setOrganizationStatus(db, admin, { organizationId: a.organizationId, status: "archived" });
    const reloaded = await loadActor(db, a.actor.userId);
    await expect(getOrganization(db, reloaded!, a.organizationId)).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});

describe("platform admin powers are server-enforced", () => {
  it("non-admins cannot list organizations or read the audit log", async () => {
    const { actor } = await createOrgWithAdmin("company");
    await expect(listOrganizations(db, actor)).rejects.toMatchObject({ code: "forbidden" });
    await expect(listAuditEvents(db, actor)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("a platform *member* (not admin) is not an admin", async () => {
    const { actor } = await createOrgWithAdmin("platform");
    const member = {
      ...actor,
      memberships: actor.memberships.map((m) => ({ ...m, role: "member" as const })),
    };
    await expect(listOrganizations(db, member)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("non-admins cannot change an organization's status, even their own", async () => {
    const a = await createOrgWithAdmin("association");
    await expect(
      setOrganizationStatus(db, a.actor, { organizationId: a.organizationId, status: "active" }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("admins can list all organizations and change status, which is audited", async () => {
    const admin = await createPlatformAdmin();
    const a = await createOrgWithAdmin("association", "Klub A");
    await createOrgWithAdmin("company", "Firma B");

    const list = await listOrganizations(db, admin);
    expect(list.map((o) => o.name).sort()).toEqual(["Firma B", "Foreningsplatform", "Klub A"]);

    await setOrganizationStatus(db, admin, {
      organizationId: a.organizationId,
      status: "suspended",
      reason: "test",
    });
    const events = await db.select().from(auditEvents).where(eq(auditEvents.entityId, a.organizationId));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      action: "organization.status_changed",
      actorUserId: admin.userId,
      metadata: { from: "active", to: "suspended", reason: "test" },
    });
  });
});

describe("self-service organization creation", () => {
  it("creates the organization with the user as admin and audits it", async () => {
    const actor = await actorWithoutOrganization();
    const org = await createOrganization(db, actor, { type: "association", name: "  Ny Klub  " });
    expect(org).toMatchObject({ name: "Ny Klub", type: "association", status: "draft" });

    const reloaded = await loadActor(db, actor.userId);
    expect(reloaded?.memberships).toEqual([
      expect.objectContaining({ organizationId: org.id, role: "admin", organizationType: "association" }),
    ]);
    const [event] = await db.select().from(auditEvents).where(eq(auditEvents.entityId, org.id));
    expect(event.action).toBe("organization.created");
  });

  it("companies start active", async () => {
    const actor = await actorWithoutOrganization();
    const org = await createOrganization(db, actor, { type: "company", name: "Firma" });
    expect(org.status).toBe("active");
  });

  it("refuses a second organization and invalid input", async () => {
    const { actor } = await createOrgWithAdmin("company");
    await expect(createOrganization(db, actor, { type: "association", name: "Klub" })).rejects.toMatchObject({
      code: "conflict",
    });
    const fresh = await actorWithoutOrganization();
    await expect(createOrganization(db, fresh, { type: "association", name: "x" })).rejects.toMatchObject({
      code: "validation",
    });
    await expect(
      createOrganization(db, fresh, { type: "platform" as "company", name: "Hack" }),
    ).rejects.toMatchObject({ code: "validation" });
  });
});
