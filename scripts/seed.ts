/**
 * Seeds reference data and DEMO accounts. Safe to run repeatedly.
 *
 *   pnpm db:seed
 *
 * - Always: catalog categories, configuration defaults, platform organization.
 * - DEMO data: one platform admin, two associations and two companies, each
 *   with a user. All demo organizations are flagged `is_demo` and named "DEMO …".
 *
 * Refuses to run when APP_ENV=production. Outside development/test the demo
 * password must be provided via SEED_DEMO_PASSWORD.
 */
import { closeDb, db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { recordAuditEvent } from "@/modules/audit/service";
import { ensureInitialCategories } from "@/modules/catalog/service";
import { ensureConfigDefaults } from "@/modules/config/service";
import {
  ensureMembership,
  ensureOrganization,
  ensurePlatformOrganization,
  ensureUserWithPassword,
} from "@/modules/identity/provisioning";

export const DEV_DEMO_PASSWORD = "Demo-adgangskode-2026";

export const demoAccounts = [
  { email: "admin@example.com", name: "Demo Admin", organization: "platform" },
  {
    email: "forening@example.com",
    name: "Demo Formand",
    organization: { type: "association", name: "DEMO Boldklubben Nord", status: "active" },
  },
  {
    email: "forening2@example.com",
    name: "Demo Kasserer",
    organization: { type: "association", name: "DEMO Svømmeklubben Havet", status: "draft" },
  },
  {
    email: "virksomhed@example.com",
    name: "Demo Indehaver",
    organization: { type: "company", name: "DEMO Bageriet på Hjørnet", status: "active" },
  },
  {
    email: "virksomhed2@example.com",
    name: "Demo Marketingchef",
    organization: { type: "company", name: "DEMO Cykelhandleren", status: "active" },
  },
] as const;

function demoPassword(): string {
  if (process.env.SEED_DEMO_PASSWORD) return process.env.SEED_DEMO_PASSWORD;
  if (env.APP_ENV === "development" || env.APP_ENV === "test") return DEV_DEMO_PASSWORD;
  throw new Error("SEED_DEMO_PASSWORD skal være sat, når APP_ENV ikke er development/test.");
}

export async function seed(): Promise<void> {
  if (env.APP_ENV === "production") {
    throw new Error("Seed-scriptet må ikke køre mod produktion (APP_ENV=production).");
  }
  const password = demoPassword();
  if (password.length < 10) throw new Error("SEED_DEMO_PASSWORD skal være mindst 10 tegn.");

  await ensureInitialCategories(db);
  await ensureConfigDefaults(db);
  const platformId = await ensurePlatformOrganization(db);

  for (const account of demoAccounts) {
    const { userId } = await ensureUserWithPassword(db, {
      email: account.email,
      name: account.name,
      password,
    });
    const organizationId =
      account.organization === "platform"
        ? platformId
        : await ensureOrganization(db, { ...account.organization, isDemo: true });
    await ensureMembership(db, { userId, organizationId });
  }

  await recordAuditEvent(db, {
    actor: null,
    action: "seed.completed",
    entityType: "system",
    metadata: { appEnv: env.APP_ENV, demoAccounts: demoAccounts.length },
  });
}

// Run only when executed directly (not when imported by tests).
if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => {
      logger.info("Seed gennemført. Demo-konti:");
      for (const a of demoAccounts) logger.info(`  ${a.email}`);
    })
    .catch((error) => {
      logger.error({ err: error }, "Seed fejlede");
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
