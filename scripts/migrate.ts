/**
 * Applies pending SQL migrations from ./drizzle.
 * Usage: pnpm db:migrate   (reads DATABASE_URL from .env or the environment)
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, db } from "@/lib/db";
import { logger } from "@/lib/logger";

async function main() {
  logger.info("Kører databasemigrationer…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  logger.info("Migrationer gennemført.");
}

main()
  .catch((error) => {
    logger.error({ err: error }, "Migration fejlede");
    process.exitCode = 1;
  })
  .finally(() => closeDb());
