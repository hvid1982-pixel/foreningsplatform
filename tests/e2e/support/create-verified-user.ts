/**
 * E2E helper: creates a verified user with a password, so a test can start
 * from a brand-new account without reading e-mails. Development/test only.
 *
 *   tsx --env-file-if-exists=.env tests/e2e/support/create-verified-user.ts <email> <name> <password>
 */
import { closeDb, db } from "@/lib/db";
import { env } from "@/lib/env";
import { ensureUserWithPassword } from "@/modules/identity/provisioning";

async function main() {
  if (env.APP_ENV !== "development" && env.APP_ENV !== "test") {
    throw new Error("Only for development/test databases");
  }
  const [email, name, password] = process.argv.slice(2);
  if (!email || !name || !password) throw new Error("usage: <email> <name> <password>");
  await ensureUserWithPassword(db, { email, name, password });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
