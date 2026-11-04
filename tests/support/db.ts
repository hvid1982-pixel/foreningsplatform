/** Helpers for integration tests. */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Actor } from "@/modules/identity/actor";
import {
  organizationMemberships,
  organizations,
  users,
  type OrganizationStatus,
  type OrganizationType,
} from "@/modules/identity/schema";
import { loadActor } from "@/modules/identity/service";

/** Empties every application table (TRUNCATE bypasses the audit row trigger). */
export async function resetDatabase(): Promise<void> {
  await db.execute(sql`
    TRUNCATE TABLE audit_events, configuration_versions, association_offerings,
      industry_exclusions, association_channels, association_locations, associations,
      product_templates, industries, catalog_categories,
      organization_memberships, organizations, sessions, accounts, verifications,
      rate_limits, users RESTART IDENTITY CASCADE
  `);
}

let counter = 0;

export async function createUser(name = "Test Bruger"): Promise<string> {
  counter += 1;
  const [user] = await db
    .insert(users)
    .values({ name, email: `user${counter}-${Date.now()}@example.com`, emailVerified: true })
    .returning({ id: users.id });
  return user.id;
}

/** Creates an organization with one admin user and returns that user's Actor. */
export async function createOrgWithAdmin(
  type: OrganizationType,
  name = `${type} ${counter + 1}`,
  status: OrganizationStatus = "active",
): Promise<{ actor: Actor; organizationId: string }> {
  const userId = await createUser();
  const [org] = await db
    .insert(organizations)
    .values({ type, name, status })
    .returning({ id: organizations.id });
  await db.insert(organizationMemberships).values({ userId, organizationId: org.id, role: "admin" });
  const actor = await loadActor(db, userId);
  if (!actor) throw new Error("actor missing");
  return { actor, organizationId: org.id };
}

export async function createPlatformAdmin(): Promise<Actor> {
  return (await createOrgWithAdmin("platform", "Foreningsplatform")).actor;
}

export async function actorWithoutOrganization(): Promise<Actor> {
  const actor = await loadActor(db, await createUser());
  if (!actor) throw new Error("actor missing");
  return actor;
}
