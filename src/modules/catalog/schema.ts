/**
 * Catalog: categories, platform-standard product templates and industries
 * (spec section 4). All of it is data, not enums: admins can add, rename and
 * archive records without a code change. Records referenced by offerings or
 * campaigns are archived, never deleted.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

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
  ...timestamps,
});

/**
 * A platform-standard product (spec section 4, "Platform-standard template"):
 * standardized description, minimum deliverables, required evidence and a
 * controlled price range. Associations create offerings from templates.
 * Prices are integer øre, excluding VAT.
 */
export const productTemplates = pgTable(
  "product_templates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => catalogCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    /** What one unit is, e.g. "opslag", "sæson", "udsendelse". */
    unit: text("unit").notNull(),
    minimumDeliverables: text("minimum_deliverables").notNull(),
    evidenceRequirements: text("evidence_requirements").notNull(),
    priceMinMinor: integer("price_min_minor").notNull(),
    priceMaxMinor: integer("price_max_minor").notNull(),
    suggestedPriceMinor: integer("suggested_price_minor").notNull(),
    currency: text("currency").notNull().default("DKK"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("product_templates_category_idx").on(t.categoryId),
    check(
      "product_templates_price_range_check",
      sql`${t.priceMinMinor} >= 0 AND ${t.priceMinMinor} <= ${t.suggestedPriceMinor} AND ${t.suggestedPriceMinor} <= ${t.priceMaxMinor}`,
    ),
  ],
);

/**
 * Advertiser industries, used by associations to exclude conflicting sponsors
 * (spec section 3, step 5) and later by companies to describe themselves.
 */
export const industries = pgTable("industries", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
});

export type CatalogCategory = typeof catalogCategories.$inferSelect;
export type ProductTemplate = typeof productTemplates.$inferSelect;
export type Industry = typeof industries.$inferSelect;
