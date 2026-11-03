import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { resetDatabase } from "../support/db";
import { db } from "@/lib/db";

/**
 * The global setup applies all migrations to an empty database. These tests
 * verify the result, so a broken or missing migration fails CI.
 */
describe("database migrations", () => {
  it("applied every migration in the journal", async () => {
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: unknown[] };
    const rows = await db.execute<{ count: string }>(sql`select count(*) from drizzle.__drizzle_migrations`);
    expect(Number(rows[0].count)).toBe(journal.entries.length);
  });

  it("created the expected tables", async () => {
    const rows = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );
    expect(rows.map((r) => r.table_name)).toEqual(
      expect.arrayContaining([
        "accounts",
        "audit_events",
        "catalog_categories",
        "configuration_versions",
        "organization_memberships",
        "organizations",
        "rate_limits",
        "sessions",
        "users",
        "verifications",
      ]),
    );
  });

  it("enables row-level security on every public table (deny-by-default for hosted APIs)", async () => {
    const rows = await db.execute<{ relname: string }>(sql`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    `);
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("enforces a single platform organization", async () => {
    await resetDatabase();
    await db.execute(sql`insert into organizations (type, name, status) values ('platform', 'P1', 'active')`);
    await expect(
      db.execute(sql`insert into organizations (type, name, status) values ('platform', 'P2', 'active')`),
    ).rejects.toThrow();
  });
});
