import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit configuration. `pnpm db:generate` writes SQL migrations to
 * ./drizzle; review them before committing. `pnpm db:migrate` applies them.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
