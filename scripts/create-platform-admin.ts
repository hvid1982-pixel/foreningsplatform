/**
 * Creates (or promotes) a platform admin. Platform admins can never be created
 * through the web UI.
 *
 *   ADMIN_PASSWORD='…' pnpm admin:create -- --email soren@example.dk --name "Søren"
 *
 * If the user already exists, the password is left unchanged and the user is
 * added to the platform organization.
 */
import { parseArgs } from "node:util";
import { closeDb, db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { recordAuditEvent } from "@/modules/audit/service";
import {
  ensureMembership,
  ensurePlatformOrganization,
  ensureUserWithPassword,
} from "@/modules/identity/provisioning";

async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
    allowPositionals: true,
  });
  if (!values.email || !values.name)
    throw new Error('Brug: pnpm admin:create -- --email <e-mail> --name "<navn>"');
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error("Sæt ADMIN_PASSWORD (mindst 12 tegn).");

  const platformId = await ensurePlatformOrganization(db);
  const { userId, created } = await ensureUserWithPassword(db, {
    email: values.email,
    name: values.name,
    password,
  });
  await ensureMembership(db, { userId, organizationId: platformId });
  await recordAuditEvent(db, {
    actor: null,
    action: "platform_admin.granted",
    entityType: "user",
    entityId: userId,
    metadata: { email: values.email, createdUser: created, via: "cli" },
  });
  logger.info(created ? "Platformadmin oprettet." : "Eksisterende bruger er nu platformadmin.");
}

main()
  .catch((error) => {
    logger.error({ err: error }, "Kunne ikke oprette platformadmin");
    process.exitCode = 1;
  })
  .finally(() => closeDb());
