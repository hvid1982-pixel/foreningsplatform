/**
 * Database client (server only).
 *
 * Uses node-postgres with a small pool and hard timeouts. On Vercel (Fluid
 * compute) instances are suspended between requests, which can leave sockets
 * stale; `attachDatabasePool` lets Vercel close idle clients before an
 * instance is suspended, and the timeouts make sure a query never hangs until
 * the function's 300 s limit. See ADR-012.
 */
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export type Database = NodePgDatabase<typeof schema>;

const isLocal = env.APP_ENV === "development" || env.APP_ENV === "test";

function createPool(): Pool {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: isLocal ? 5 : 3,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    query_timeout: 15_000,
    statement_timeout: 15_000,
  });
  // An idle client that errors (e.g. the server closed it) must not crash the process.
  pool.on("error", () => {});
  if (process.env.VERCEL) attachDatabasePool(pool);
  return pool;
}

const globalForDb = globalThis as unknown as { pgPool?: Pool };
const pool = globalForDb.pgPool ?? createPool();
if (env.APP_ENV !== "production") globalForDb.pgPool = pool;

export const db: Database = drizzle(pool, { schema, casing: "snake_case" });

export async function closeDb(): Promise<void> {
  await pool.end();
}

export type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];
