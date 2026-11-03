import { describe, expect, it } from "vitest";
import type { Actor, ActorMembership } from "./actor";
import {
  assertCanManageOrganization,
  assertCanViewOrganization,
  assertPlatformAdmin,
  canCreateOrganization,
  canManageOrganization,
  canViewOrganization,
  homePathFor,
  isPlatformAdmin,
} from "./policies";

function actor(...memberships: Partial<ActorMembership>[]): Actor {
  return {
    userId: "u1",
    email: "u1@example.com",
    name: "U1",
    memberships: memberships.map((m, i) => ({
      organizationId: `org-${i}`,
      organizationType: "association",
      organizationName: `Org ${i}`,
      role: "admin",
      ...m,
    })),
  };
}

describe("identity policies", () => {
  it("only an admin membership of the platform organization makes a platform admin", () => {
    expect(isPlatformAdmin(actor({ organizationType: "platform", role: "admin" }))).toBe(true);
    expect(isPlatformAdmin(actor({ organizationType: "platform", role: "member" }))).toBe(false);
    expect(isPlatformAdmin(actor({ organizationType: "association", role: "admin" }))).toBe(false);
    expect(isPlatformAdmin(actor())).toBe(false);
    expect(() => assertPlatformAdmin(actor({ organizationType: "company" }))).toThrow(/platform admin/);
  });

  it("members can view their own organization but not others", () => {
    const a = actor({ organizationId: "mine" });
    expect(canViewOrganization(a, "mine")).toBe(true);
    expect(canViewOrganization(a, "theirs")).toBe(false);
    expect(() => assertCanViewOrganization(a, "theirs")).toThrow(/no access/);
  });

  it("platform admins can view any organization", () => {
    expect(canViewOrganization(actor({ organizationType: "platform" }), "any-org")).toBe(true);
  });

  it("managing requires an admin membership in that exact organization", () => {
    expect(canManageOrganization(actor({ organizationId: "mine", role: "admin" }), "mine")).toBe(true);
    expect(canManageOrganization(actor({ organizationId: "mine", role: "member" }), "mine")).toBe(false);
    // Platform admins do NOT silently get write access to tenant data.
    expect(canManageOrganization(actor({ organizationType: "platform" }), "tenant")).toBe(false);
    expect(() => assertCanManageOrganization(actor(), "tenant")).toThrow(/cannot manage/);
  });

  it("a user can self-create one association or company, never a platform org", () => {
    expect(canCreateOrganization(actor(), "association")).toBe(true);
    expect(canCreateOrganization(actor(), "company")).toBe(true);
    expect(canCreateOrganization(actor(), "platform")).toBe(false);
    expect(canCreateOrganization(actor({ organizationType: "company" }), "association")).toBe(false);
    expect(canCreateOrganization(actor({ organizationType: "platform" }), "company")).toBe(true);
  });

  it("routes users to the right home page", () => {
    expect(homePathFor(actor())).toBe("/kom-i-gang");
    expect(homePathFor(actor({ organizationType: "association" }))).toBe("/forening");
    expect(homePathFor(actor({ organizationType: "company" }))).toBe("/virksomhed");
    expect(homePathFor(actor({ organizationType: "platform" }, { organizationType: "company" }))).toBe(
      "/admin",
    );
  });
});
