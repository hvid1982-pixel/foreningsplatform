/**
 * Data Access Layer for the current request's user.
 *
 * Pages, layouts and server actions get the signed-in user ONLY through these
 * functions. They verify the session against the database on every request
 * (the proxy's cookie check is just a fast pre-filter).
 */
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Actor } from "@/modules/identity/actor";
import { homePathFor, isPlatformAdmin } from "@/modules/identity/policies";
import { loadActor } from "@/modules/identity/service";

/** The signed-in actor, or null. Cached per request. */
export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return loadActor(db, session.user.id);
});

/** The signed-in actor; redirects to login if there is none. */
export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) redirect("/log-ind");
  return actor;
}

/** Platform admins only; everyone else is sent to their own home page. */
export async function requirePlatformAdmin(): Promise<Actor> {
  const actor = await requireActor();
  if (!isPlatformAdmin(actor)) redirect(homePathFor(actor));
  return actor;
}

/** Requires an admin membership of the given organization type. */
export async function requireOrganizationAdmin(type: "association" | "company") {
  const actor = await requireActor();
  const membership = actor.memberships.find((m) => m.organizationType === type && m.role === "admin");
  if (!membership) redirect(homePathFor(actor));
  return { actor, membership };
}
