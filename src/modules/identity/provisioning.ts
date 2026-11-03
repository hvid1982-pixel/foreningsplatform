/**
 * Provisioning helpers for scripts (seed, create-platform-admin). Not exposed
 * over HTTP. Creates users directly with a hashed password and a verified
 * e-mail, the same way Better Auth stores e-mail/password accounts.
 */
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import type { Database } from "@/lib/db";
import { accounts, organizationMemberships, organizations, users, type OrganizationType } from "./schema";

export const PLATFORM_ORGANIZATION_NAME = "Foreningsplatform";

/** Returns the user id; creates the user (verified) if the e-mail is unknown. */
export async function ensureUserWithPassword(
  db: Database,
  input: { email: string; name: string; password: string },
): Promise<{ userId: string; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { userId: existing.id, created: false };

  const context = await auth.$context;
  const passwordHash = await context.password.hash(input.password);
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email, name: input.name, emailVerified: true })
      .returning({ id: users.id });
    await tx.insert(accounts).values({
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    });
    return { userId: user.id, created: true };
  });
}

/** Returns the single platform organization, creating it if needed. */
export async function ensurePlatformOrganization(db: Database): Promise<string> {
  const existing = await db.query.organizations.findFirst({ where: eq(organizations.type, "platform") });
  if (existing) return existing.id;
  const [created] = await db
    .insert(organizations)
    .values({ type: "platform", name: PLATFORM_ORGANIZATION_NAME, status: "active" })
    .returning({ id: organizations.id });
  return created.id;
}

export async function ensureOrganization(
  db: Database,
  input: {
    type: Exclude<OrganizationType, "platform">;
    name: string;
    status: "draft" | "active";
    isDemo: boolean;
  },
): Promise<string> {
  const existing = await db.query.organizations.findFirst({
    where: and(eq(organizations.type, input.type), eq(organizations.name, input.name)),
  });
  if (existing) return existing.id;
  const [created] = await db.insert(organizations).values(input).returning({ id: organizations.id });
  return created.id;
}

export async function ensureMembership(
  db: Database,
  input: { userId: string; organizationId: string; role?: "admin" | "member" },
): Promise<void> {
  await db
    .insert(organizationMemberships)
    .values({ userId: input.userId, organizationId: input.organizationId, role: input.role ?? "admin" })
    .onConflictDoNothing();
}
