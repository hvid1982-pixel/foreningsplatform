/**
 * The authenticated principal performing an action. Every service function
 * that reads or writes tenant data takes an `Actor` as its first argument, so
 * authorization can be checked (and tested) without an HTTP request.
 */
import type { MembershipRole, OrganizationType } from "./schema";

export type ActorMembership = {
  organizationId: string;
  organizationType: OrganizationType;
  organizationName: string;
  role: MembershipRole;
};

export type Actor = {
  userId: string;
  email: string;
  name: string;
  memberships: ActorMembership[];
};
