/**
 * Build command for Vercel (set "Build Command" to `pnpm vercel-build`).
 *
 * Optionally applies migrations and seeds demo data before `next build`,
 * controlled by environment variables so each Vercel environment can choose:
 *   RUN_MIGRATIONS_ON_BUILD=true
 *   SEED_ON_BUILD=true          (refused when APP_ENV=production)
 */
import { execSync } from "node:child_process";

function run(command: string) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}

if (process.env.RUN_MIGRATIONS_ON_BUILD === "true") run("pnpm db:migrate");
if (process.env.SEED_ON_BUILD === "true") run("pnpm db:seed");
run("pnpm build");
