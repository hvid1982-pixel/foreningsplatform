/**
 * Authorization and business rules for the supply side. Pure functions, no
 * database access, unit tested in `policies.test.ts`.
 */
import { ForbiddenError } from "@/lib/errors";
import type { Actor } from "@/modules/identity/actor";
import { isPlatformAdmin, membershipFor } from "@/modules/identity/policies";
import type { OrganizationStatus } from "@/modules/identity/schema";
import type { OfferingKind, OfferingStatus } from "./schema";

/** The association's own admins may edit its profile and offerings. */
export function canEditAssociation(actor: Actor, organizationId: string): boolean {
  const membership = membershipFor(actor, organizationId);
  return membership?.organizationType === "association" && membership.role === "admin";
}

/**
 * Platform admins may read every association's data, and may edit it through
 * the same audited services when they assist an association over a call
 * (spec section 3: "use authorized editing tools; never share passwords").
 */
export function canAssistAssociation(actor: Actor, organizationId: string): boolean {
  return canEditAssociation(actor, organizationId) || isPlatformAdmin(actor);
}

export function canViewAssociation(actor: Actor, organizationId: string): boolean {
  return membershipFor(actor, organizationId) !== undefined || isPlatformAdmin(actor);
}

export function assertCanAssistAssociation(actor: Actor, organizationId: string): void {
  if (!canAssistAssociation(actor, organizationId)) {
    throw new ForbiddenError(`cannot edit association ${organizationId}`);
  }
}

export function assertCanViewAssociation(actor: Actor, organizationId: string): void {
  if (!canViewAssociation(actor, organizationId)) {
    throw new ForbiddenError(`no access to association ${organizationId}`);
  }
}

/** An association can be submitted for review from draft only. */
export function canSubmitAssociation(status: OrganizationStatus): boolean {
  return status === "draft";
}

/** Fields a profile must have before it can be submitted (onboarding step 6). */
export type ProfileCompleteness = {
  name: boolean;
  address: boolean;
  region: boolean;
  contact: boolean;
  description: boolean;
  channelOrLocation: boolean;
  offering: boolean;
};

export function missingForSubmission(c: ProfileCompleteness): (keyof ProfileCompleteness)[] {
  return (Object.keys(c) as (keyof ProfileCompleteness)[]).filter((key) => !c[key]);
}

/**
 * What status an offering gets when the association submits it.
 *
 * - Custom offerings need admin approval while the rule
 *   `catalog.custom_offering_requires_approval` is on (default).
 * - Standard offerings are approved directly when their price is inside the
 *   template's controlled range; otherwise an admin must look at the price.
 */
export function statusOnSubmit(input: {
  kind: OfferingKind;
  priceMinor: number;
  templateRange?: { minMinor: number; maxMinor: number };
  customRequiresApproval: boolean;
}): Extract<OfferingStatus, "approved" | "pending_review"> {
  if (input.kind === "custom") return input.customRequiresApproval ? "pending_review" : "approved";
  const range = input.templateRange;
  if (!range) return "pending_review";
  return input.priceMinor >= range.minMinor && input.priceMinor <= range.maxMinor
    ? "approved"
    : "pending_review";
}

/** Statuses from which the association may edit an offering. */
export function canEditOffering(status: OfferingStatus): boolean {
  return status !== "archived";
}

/**
 * Edits to an approved offering that change what is sold or its price send it
 * back to review, using the same rule as a first submission.
 */
export const reviewRelevantOfferingFields = [
  "title",
  "description",
  "unit",
  "priceMinor",
  "categoryId",
] as const;

export function canReviewOffering(status: OfferingStatus): boolean {
  return status === "pending_review";
}

/** An offering is visible to companies only when both it and its association are live. */
export function isOfferingPublished(offering: OfferingStatus, association: OrganizationStatus): boolean {
  return offering === "approved" && association === "active";
}
