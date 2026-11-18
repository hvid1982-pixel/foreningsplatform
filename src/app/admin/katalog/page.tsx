import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatMoney, money } from "@/lib/money";
import { listProductTemplates } from "@/modules/catalog/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";
import { setTemplateArchivedAction } from "../actions";

export const metadata: Metadata = { title: da.admin.catalogTitle };

export default function AdminCatalogPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Catalog />
    </Suspense>
  );
}

async function Catalog() {
  await requirePlatformAdmin();
  const templates = await listProductTemplates(db, { includeArchived: true });
  const cols = da.admin.columns;
  return (
    <>
      <PageHeader
        title={da.admin.catalogTitle}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {da.admin.catalogIntro}
            <Badge variant="warning">{da.common.notApproved}</Badge>
          </span>
        }
        actions={
          <Button asChild>
            <Link href="/admin/katalog/ny">{da.admin.newTemplate}</Link>
          </Button>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{cols.name}</TableHead>
            <TableHead>{cols.category}</TableHead>
            <TableHead>{cols.unit}</TableHead>
            <TableHead className="text-right">{cols.priceRange}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            <TableRow key={t.id} className={t.archivedAt ? "opacity-60" : undefined}>
              <TableCell className="font-medium">
                <Link href={`/admin/katalog/${t.id}`} className="underline-offset-4 hover:underline">
                  {t.name}
                </Link>
                {t.archivedAt && (
                  <Badge variant="outline" className="ml-2">
                    {da.admin.templateArchived}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{t.categoryName}</TableCell>
              <TableCell>{t.unit}</TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatMoney(money(t.priceMinMinor))} – {formatMoney(money(t.priceMaxMinor))}
                <div className="text-xs text-muted-foreground">
                  {da.admin.priceSuggested.replace(" i kr.", "")}: {formatMoney(money(t.suggestedPriceMinor))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <form action={setTemplateArchivedAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="archived" value={t.archivedAt ? "false" : "true"} />
                  <Button type="submit" variant="ghost" size="sm">
                    {t.archivedAt ? da.admin.restoreTemplate : da.admin.archiveTemplate}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
