/**
 * Runs once before all tests: recreates the test database schema from scratch
 * and applies every migration. This doubles as the "migrations run on an empty
 * database" check.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url || !/_test\b|test/.test(new URL(url).pathname)) {
    throw new Error(`Refusing to run tests against a non-test database: ${url}`);
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  await pool.query(
    "SET client_min_messages = warning; DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;",
  );
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
}
