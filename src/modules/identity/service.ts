/**
 * Organization and membership use cases. All functions take an explicit
 * `Actor` and enforce authorization before touching data.
 */
import { and, asc, count, eq, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/modules/audit/service";
import type { Actor, ActorMembership } from "./actor";
import { assertCanViewOrganization, assertPlatformAdmin, canCreateOrganization } from "./policies";
import {
  organizationMemberships,
  organizations,
  users,
  type Organization,
  type OrganizationStatus,
} from "./schema";
import {
  createOrganizationSchema,
  setOrganizationStatusSchema,
  type CreateOrganizationInput,
} from "./validation";

/** Builds the Actor for a user id, or null if the user does not exist. */
export async function loadActor(db: Database, userId: string): Promise<Actor | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;

  const rows = await db
    .select({
      organizationId: organizations.id,
      organizationType: organizations.type,
      organizationName: organizations.name,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(and(eq(organizationMemberships.userId, userId), isNull(organizations.archivedAt)))
    .orderBy(asc(organizations.createdAt));

  const memberships: ActorMembership[] = rows;
  return { userId: user.id, email: user.email, name: user.name, memberships };
}

/**
 * Self-service creation of an association or company. The creating user
 * becomes its admin. Associations start as `draft` (activated after review in
 * Milestone 1); companies start as `active`.
 */
export async function createOrganization(
  db: Database,
  actor: Actor,
  input: CreateOrganizationInput,
): Promise<Organization> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid organization input", parsed.error.flatten());
  const { type, name } = parsed.data;

  if (!canCreateOrganization(actor, type)) {
    throw new ConflictError("User already belongs to an association or company");
  }

  return db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(organizations)
      .values({ type, name, status: type === "association" ? "draft" : "active" })
      .returning();
    await tx.insert(organizationMemberships).values({
      userId: actor.userId,
      organizationId: organization.id,
      role: "admin",
    });
    await recordAuditEvent(tx, {
      actor,
      actorOrganizationId: organization.id,
      action: "organization.created",
      entityType: "organization",
      entityId: organization.id,
      metadata: { type, name },
    });
    return organization;
  });
}

/** Reads one organization. Members and platform admins only. */
export async function getOrganization(
  db: Database,
  actor: Actor,
  organizationId: string,
): Promise<Organization> {
  assertCanViewOrganization(actor, organizationId);
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });
  if (!organization) throw new NotFoundError("organization", organizationId);
  return organization;
}

export type OrganizationListRow = Pick<
  Organization,
  "id" | "type" | "name" | "status" | "isDemo" | "createdAt"
> & { memberCount: number };

/** All organizations, for the admin console. Platform admins only. */
export async function listOrganizations(db: Database, actor: Actor): Promise<OrganizationListRow[]> {
  assertPlatformAdmin(actor);
  return db
    .select({
      id: organizations.id,
      type: organizations.type,
      name: organizations.name,
      status: organizations.status,
      isDemo: organizations.isDemo,
      createdAt: organizations.createdAt,
      memberCount: count(organizationMemberships.id),
    })
    .from(organizations)
    .leftJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
    .groupBy(organizations.id)
    .orderBy(asc(organizations.type), asc(organizations.name));
}

/** Changes an organization's lifecycle status. Platform admins only; audited. */
export async function setOrganizationStatus(
  db: Database,
  actor: Actor,
  input: { organizationId: string; status: OrganizationStatus; reason?: string },
): Promise<Organization> {
  assertPlatformAdmin(actor);
  const parsed = setOrganizationStatusSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid status input", parsed.error.flatten());
  const { organizationId, status, reason } = parsed.data;

  return db.transaction(async (tx) => {
    const current = await tx.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
    if (!current) throw new NotFoundError("organization", organizationId);
    if (current.type === "platform") throw new ForbiddenError("platform organization status is fixed");

    const [updated] = await tx
      .update(organizations)
      .set({ status, archivedAt: status === "archived" ? new Date() : null })
      .where(eq(organizations.id, organizationId))
      .returning();
    await recordAuditEvent(tx, {
      actor,
      action: "organization.status_changed",
      entityType: "organization",
      entityId: organizationId,
      metadata: { from: current.status, to: status, reason: reason ?? null },
    });
    return updated;
  });
}
