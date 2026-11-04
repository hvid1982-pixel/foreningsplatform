/**
 * Drops all tables in the development database and re-applies migrations and
 * seed data. Refuses to run unless APP_ENV=development.
 *
 *   pnpm db:reset
 */
import { execSync } from "node:child_process";
import { Pool } from "pg";

async function main() {
  if ((process.env.APP_ENV ?? "development") !== "development") {
    throw new Error("db:reset må kun køre med APP_ENV=development.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "", max: 1 });
  await pool.query(
    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;",
  );
  await pool.end();
  execSync("pnpm db:migrate && pnpm db:seed", { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
