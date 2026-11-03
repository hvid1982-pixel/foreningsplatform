/**
 * Database client (Drizzle on top of postgres.js).
 *
 * A single pooled client is reused per server instance. On serverless hosts use
 * a transaction-mode pooler URL (Supabase: port 6543); prepared statements are
 * disabled so that works. See docs/runbooks/deployment.md.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: env.APP_ENV === "development" || env.APP_ENV === "test" ? 5 : 3,
    onnotice: () => {},
  });

if (env.APP_ENV !== "production") globalForDb.pgClient = client;

export const db: Database = drizzle(client, { schema, casing: "snake_case" });

/** Closes the pool. Only for scripts and tests. */
export async function closeDb(): Promise<void> {
  await client.end({ timeout: 5 });
}

/** A database handle or an open transaction; services accept either. */
export type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];
