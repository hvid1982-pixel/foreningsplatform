import { describe, expect, it } from "vitest";
import type { Actor, ActorMembership } from "@/modules/identity/actor";
import {
  canAssistAssociation,
  canEditAssociation,
  canViewAssociation,
  isOfferingPublished,
  missingForSubmission,
  statusOnSubmit,
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

const range = { minMinor: 30_000, maxMinor: 250_000 };

describe("supply policies", () => {
  it("association admins edit their own association; platform admins may assist", () => {
    const own = actor({ organizationId: "a" });
    const member = actor({ organizationId: "a", role: "member" });
    const company = actor({ organizationId: "a", organizationType: "company" });
    const platform = actor({ organizationId: "p", organizationType: "platform" });
    expect(canEditAssociation(own, "a")).toBe(true);
    expect(canEditAssociation(own, "b")).toBe(false);
    expect(canEditAssociation(member, "a")).toBe(false);
    expect(canEditAssociation(company, "a")).toBe(false);
    expect(canEditAssociation(platform, "a")).toBe(false);
    expect(canAssistAssociation(platform, "a")).toBe(true);
    expect(canViewAssociation(member, "a")).toBe(true);
    expect(canViewAssociation(own, "b")).toBe(false);
  });

  it("standard offerings inside the template price range are approved directly", () => {
    const base = { kind: "standard" as const, templateRange: range, customRequiresApproval: true };
    expect(statusOnSubmit({ ...base, priceMinor: 30_000 })).toBe("approved");
    expect(statusOnSubmit({ ...base, priceMinor: 250_000 })).toBe("approved");
    expect(statusOnSubmit({ ...base, priceMinor: 29_999 })).toBe("pending_review");
    expect(statusOnSubmit({ ...base, priceMinor: 250_001 })).toBe("pending_review");
    expect(statusOnSubmit({ ...base, templateRange: undefined, priceMinor: 50_000 })).toBe("pending_review");
  });

  it("custom offerings follow the approval rule", () => {
    expect(statusOnSubmit({ kind: "custom", priceMinor: 1, customRequiresApproval: true })).toBe(
      "pending_review",
    );
    expect(statusOnSubmit({ kind: "custom", priceMinor: 1, customRequiresApproval: false })).toBe("approved");
  });

  it("only approved offerings of active associations are published", () => {
    expect(isOfferingPublished("approved", "active")).toBe(true);
    expect(isOfferingPublished("approved", "pending_review")).toBe(false);
    expect(isOfferingPublished("approved", "suspended")).toBe(false);
    expect(isOfferingPublished("pending_review", "active")).toBe(false);
  });

  it("lists missing profile parts in a stable order", () => {
    expect(
      missingForSubmission({
        name: true,
        address: false,
        region: true,
        contact: true,
        description: false,
        channelOrLocation: true,
        offering: false,
      }),
    ).toEqual(["address", "description", "offering"]);
  });
});
