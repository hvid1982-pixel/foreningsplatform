import { asc, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { catalogCategories, type CatalogCategory } from "./schema";
import { initialCatalogCategories } from "./seed-data";

/** Active (non-archived) categories in display order. Public data. */
export async function listActiveCategories(db: Database): Promise<CatalogCategory[]> {
  return db
    .select()
    .from(catalogCategories)
    .where(isNull(catalogCategories.archivedAt))
    .orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.name));
}

/** Inserts missing initial categories; never overwrites existing ones. */
export async function ensureInitialCategories(db: Database): Promise<void> {
  await db
    .insert(catalogCategories)
    .values(initialCatalogCategories.map((c, index) => ({ ...c, sortOrder: (index + 1) * 10 })))
    .onConflictDoNothing({ target: catalogCategories.slug });
}
