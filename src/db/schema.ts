/**
 * Aggregates every module's tables so Drizzle (queries and migrations) sees the
 * whole schema. Add new modules here.
 */
export * from "@/modules/identity/schema";
export * from "@/modules/audit/schema";
export * from "@/modules/config/schema";
export * from "@/modules/catalog/schema";
