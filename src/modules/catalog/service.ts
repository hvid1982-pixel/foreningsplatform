/**
 * Catalog use cases: categories, platform-standard product templates and
 * industries. Reading active records is open to any signed-in user; changes
 * are for platform admins only and are audited.
 */
import { asc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/modules/audit/service";
import type { Actor } from "@/modules/identity/actor";
import { assertPlatformAdmin } from "@/modules/identity/policies";
import {
  catalogCategories,
  industries,
  productTemplates,
  type CatalogCategory,
  type Industry,
  type ProductTemplate,
} from "./schema";
import { initialCatalogCategories, initialIndustries, initialProductTemplates } from "./seed-data";
import { productTemplateSchema, type ProductTemplateInput } from "./validation";

/** Active (non-archived) categories in display order. Public data. */
export async function listActiveCategories(db: Database): Promise<CatalogCategory[]> {
  return db
    .select()
    .from(catalogCategories)
    .where(isNull(catalogCategories.archivedAt))
    .orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.name));
}

export type TemplateRow = ProductTemplate & { categoryName: string };

/** Product templates with category names. `includeArchived` is for admins. */
export async function listProductTemplates(
  db: Database,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<TemplateRow[]> {
  const rows = await db
    .select({ template: productTemplates, categoryName: catalogCategories.name })
    .from(productTemplates)
    .innerJoin(catalogCategories, eq(catalogCategories.id, productTemplates.categoryId))
    .where(includeArchived ? undefined : isNull(productTemplates.archivedAt))
    .orderBy(asc(catalogCategories.sortOrder), asc(productTemplates.sortOrder), asc(productTemplates.name));
  return rows.map((row) => ({ ...row.template, categoryName: row.categoryName }));
}

export async function getProductTemplate(db: Database, templateId: string): Promise<ProductTemplate> {
  const template = await db.query.productTemplates.findFirst({ where: eq(productTemplates.id, templateId) });
  if (!template) throw new NotFoundError("product template", templateId);
  return template;
}

export async function listActiveIndustries(db: Database): Promise<Industry[]> {
  return db
    .select()
    .from(industries)
    .where(isNull(industries.archivedAt))
    .orderBy(asc(industries.sortOrder), asc(industries.name));
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "oe")
      .replace(/å/g, "aa")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "produkt"
  );
}

/**
 * Creates a template. Admins only. Changing templates never changes existing
 * offerings or campaigns: offerings copy unit and evidence at creation, and
 * confirmed campaigns snapshot their terms (M4).
 */
export async function createProductTemplate(
  db: Database,
  actor: Actor,
  input: ProductTemplateInput,
): Promise<ProductTemplate> {
  assertPlatformAdmin(actor);
  const parsed = productTemplateSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid product template", parsed.error.flatten());
  const { note, ...fields } = parsed.data;
  return db.transaction(async (tx) => {
    const [template] = await tx
      .insert(productTemplates)
      .values({ ...fields, slug: `${slugify(fields.name)}_${Date.now().toString(36)}` })
      .returning();
    await recordAuditEvent(tx, {
      actor,
      action: "catalog.template_created",
      entityType: "product_template",
      entityId: template.id,
      metadata: { name: fields.name, note },
    });
    return template;
  });
}

export async function updateProductTemplate(
  db: Database,
  actor: Actor,
  templateId: string,
  input: ProductTemplateInput,
): Promise<ProductTemplate> {
  assertPlatformAdmin(actor);
  const parsed = productTemplateSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("Invalid product template", parsed.error.flatten());
  const { note, ...fields } = parsed.data;
  return db.transaction(async (tx) => {
    const current = await tx.query.productTemplates.findFirst({ where: eq(productTemplates.id, templateId) });
    if (!current) throw new NotFoundError("product template", templateId);
    const [updated] = await tx
      .update(productTemplates)
      .set(fields)
      .where(eq(productTemplates.id, templateId))
      .returning();
    await recordAuditEvent(tx, {
      actor,
      action: "catalog.template_updated",
      entityType: "product_template",
      entityId: templateId,
      metadata: {
        note,
        from: {
          priceMinMinor: current.priceMinMinor,
          suggestedPriceMinor: current.suggestedPriceMinor,
          priceMaxMinor: current.priceMaxMinor,
        },
        to: {
          priceMinMinor: updated.priceMinMinor,
          suggestedPriceMinor: updated.suggestedPriceMinor,
          priceMaxMinor: updated.priceMaxMinor,
        },
      },
    });
    return updated;
  });
}

/** Archives or restores a template. Existing offerings based on it are unaffected. */
export async function setProductTemplateArchived(
  db: Database,
  actor: Actor,
  templateId: string,
  archived: boolean,
): Promise<void> {
  assertPlatformAdmin(actor);
  await db.transaction(async (tx) => {
    const current = await tx.query.productTemplates.findFirst({ where: eq(productTemplates.id, templateId) });
    if (!current) throw new NotFoundError("product template", templateId);
    await tx
      .update(productTemplates)
      .set({ archivedAt: archived ? new Date() : null })
      .where(eq(productTemplates.id, templateId));
    await recordAuditEvent(tx, {
      actor,
      action: archived ? "catalog.template_archived" : "catalog.template_restored",
      entityType: "product_template",
      entityId: templateId,
    });
  });
}

/** Inserts missing initial categories; never overwrites existing ones. */
export async function ensureInitialCategories(db: Database): Promise<void> {
  await db
    .insert(catalogCategories)
    .values(initialCatalogCategories.map((c, index) => ({ ...c, sortOrder: (index + 1) * 10 })))
    .onConflictDoNothing({ target: catalogCategories.slug });
}

/** Inserts missing initial templates and industries (by slug); never overwrites. */
export async function ensureInitialCatalog(db: Database): Promise<void> {
  await ensureInitialCategories(db);
  const categories = await db.select().from(catalogCategories);
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  await db
    .insert(productTemplates)
    .values(
      initialProductTemplates.map((t, index) => {
        const categoryId = idBySlug.get(t.categorySlug);
        if (!categoryId) throw new Error(`Missing category ${t.categorySlug}`);
        const [min, suggested, max] = t.priceKroner;
        return {
          slug: t.slug,
          categoryId,
          name: t.name,
          description: t.description,
          unit: t.unit,
          minimumDeliverables: t.minimumDeliverables,
          evidenceRequirements: t.evidenceRequirements,
          priceMinMinor: min * 100,
          suggestedPriceMinor: suggested * 100,
          priceMaxMinor: max * 100,
          sortOrder: (index + 1) * 10,
        };
      }),
    )
    .onConflictDoNothing({ target: productTemplates.slug });
  await db
    .insert(industries)
    .values(initialIndustries.map((i, index) => ({ ...i, sortOrder: (index + 1) * 10 })))
    .onConflictDoNothing({ target: industries.slug });
}
