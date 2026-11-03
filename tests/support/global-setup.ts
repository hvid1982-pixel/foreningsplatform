/**
 * Runs once before all tests: recreates the test database schema from scratch
 * and applies every migration. This doubles as the "migrations run on an empty
 * database" check.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url || !/_test\b|test/.test(new URL(url).pathname)) {
    throw new Error(`Refusing to run tests against a non-test database: ${url}`);
  }
  const sql = postgres(url, { onnotice: () => {}, max: 1 });
  await sql.unsafe(
    "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;",
  );
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  await sql.end();
}
