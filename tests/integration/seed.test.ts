import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { catalogCategories } from "@/modules/catalog/schema";
import { organizations, users } from "@/modules/identity/schema";
import { loadActor } from "@/modules/identity/service";
import { isPlatformAdmin } from "@/modules/identity/policies";
import { demoAccounts, seed } from "../../scripts/seed";
import { resetDatabase } from "../support/db";

beforeEach(resetDatabase);

describe("seed script", () => {
  it("creates demo accounts for every role and is idempotent", async () => {
    await seed();
    await seed();
    const allUsers = await db.select().from(users);
    expect(allUsers).toHaveLength(demoAccounts.length);
    expect(allUsers.every((u) => u.emailVerified)).toBe(true);

    const orgs = await db.select().from(organizations);
    expect(orgs.filter((o) => o.type === "platform")).toHaveLength(1);
    expect(
      orgs.filter((o) => o.type !== "platform").every((o) => o.isDemo && o.name.startsWith("DEMO")),
    ).toBe(true);

    const admin = allUsers.find((u) => u.email === "admin@example.com")!;
    expect(isPlatformAdmin((await loadActor(db, admin.id))!)).toBe(true);
    expect(await db.select().from(catalogCategories)).toHaveLength(6);
  });

  it("refuses to run in production", async () => {
    const original = env.APP_ENV;
    env.APP_ENV = "production";
    try {
      await expect(seed()).rejects.toThrow(/produktion/);
    } finally {
      env.APP_ENV = original;
    }
    expect(await db.select().from(users)).toHaveLength(0);
  });
});
