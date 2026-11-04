/**
 * Health check for uptime monitoring: GET /api/health
 * Returns 200 when the app can reach the database, 503 otherwise.
 */
import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  await connection();
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "ok",
      database: "ok",
      latencyMs: Date.now() - startedAt,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    });
  } catch (error) {
    logger.error({ err: error, module: "health" }, "Health check failed");
    return Response.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
