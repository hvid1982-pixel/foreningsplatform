/**
 * Authorization rules for organizations. Pure functions: no database access,
 * so they are cheap to unit test. Services call the `assert*` variants.
 *
 * Rule of thumb: tenant data is visible only to members of that organization
 * and to platform admins. Admin powers come exclusively from an `admin`
 * membership in the single `platform` organization.
 */
import { ForbiddenError } from "@/lib/errors";
import type { Actor, ActorMembership } from "./actor";
import type { OrganizationType } from "./schema";

export function isPlatformAdmin(actor: Actor): boolean {
  return actor.memberships.some((m) => m.organizationType === "platform" && m.role === "admin");
}

export function membershipFor(actor: Actor, organizationId: string): ActorMembership | undefined {
  return actor.memberships.find((m) => m.organizationId === organizationId);
}

export function canViewOrganization(actor: Actor, organizationId: string): boolean {
  return isPlatformAdmin(actor) || membershipFor(actor, organizationId) !== undefined;
}

/** Editing an organization's own data requires an admin membership in it. */
export function canManageOrganization(actor: Actor, organizationId: string): boolean {
  return membershipFor(actor, organizationId)?.role === "admin";
}

/**
 * MVP: a user may self-create one association or company organization. More
 * than one per user (e.g. a consultant serving several clubs) is a later
 * extension, see BACKLOG.md.
 */
export function canCreateOrganization(actor: Actor, type: OrganizationType): boolean {
  if (type === "platform") return false;
  return !actor.memberships.some(
    (m) => m.organizationType === "association" || m.organizationType === "company",
  );
}

export function assertPlatformAdmin(actor: Actor): void {
  if (!isPlatformAdmin(actor)) throw new ForbiddenError("platform admin required");
}

export function assertCanViewOrganization(actor: Actor, organizationId: string): void {
  if (!canViewOrganization(actor, organizationId)) {
    throw new ForbiddenError(`no access to organization ${organizationId}`);
  }
}

export function assertCanManageOrganization(actor: Actor, organizationId: string): void {
  if (!canManageOrganization(actor, organizationId)) {
    throw new ForbiddenError(`cannot manage organization ${organizationId}`);
  }
}

/** Where a signed-in user should land after login. */
export function homePathFor(actor: Actor): string {
  if (isPlatformAdmin(actor)) return "/admin";
  const primary = actor.memberships.find(
    (m) => m.organizationType === "association" || m.organizationType === "company",
  );
  if (!primary) return "/kom-i-gang";
  return primary.organizationType === "association" ? "/forening" : "/virksomhed";
}
