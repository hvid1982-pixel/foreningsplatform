/**
 * Catalog categories (spec section 4). Categories are data, not enums: admins
 * can add, rename and archive them without a code change. Product templates and
 * offerings arrive in Milestone 1.
 */
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const catalogCategories = pgTable("catalog_categories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  /** Stable machine key, e.g. `digital_exposure`. Never reused. */
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type CatalogCategory = typeof catalogCategories.$inferSelect;
