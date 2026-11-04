import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { DemoBadge } from "@/components/organization-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatMoney, money } from "@/lib/money";
import { listReviewQueue } from "@/modules/associations/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";

export const metadata: Metadata = { title: da.admin.reviewsTitle };

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Reviews />
    </Suspense>
  );
}

async function Reviews() {
  const actor = await requirePlatformAdmin();
  const queue = await listReviewQueue(db, actor);
  const cols = da.admin.columns;
  const empty = queue.associations.length === 0 && queue.offerings.length === 0;
  return (
    <>
      <PageHeader title={da.admin.reviewsTitle} description={da.admin.reviewsIntro} />
      {empty ? (
        <EmptyState title={da.admin.reviewsEmpty} />
      ) : (
        <div className="grid gap-10">
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">{da.admin.reviewsAssociations}</h2>
            {queue.associations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{da.admin.reviewsEmpty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cols.association}</TableHead>
                    <TableHead>{da.admin.submittedAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.associations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/organisationer/${a.id}`}
                          className="flex items-center gap-2 underline-offset-4 hover:underline"
                        >
                          {a.name}
                          {a.isDemo && <DemoBadge />}
                        </Link>
                      </TableCell>
                      <TableCell>{a.submittedAt ? formatDateTime(a.submittedAt) : "–"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">{da.admin.reviewsOfferings}</h2>
            {queue.offerings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{da.admin.reviewsEmpty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cols.offering}</TableHead>
                    <TableHead>{cols.association}</TableHead>
                    <TableHead className="text-right">{cols.price}</TableHead>
                    <TableHead>{da.admin.submittedAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.offerings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/organisationer/${o.organizationId}#produkt-${o.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {o.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {o.kind === "standard" ? da.offering.standard : da.offering.custom} ·{" "}
                          {o.categoryName}
                        </div>
                      </TableCell>
                      <TableCell>{o.organizationName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(money(o.priceMinor))}{" "}
                        <span className="text-xs text-muted-foreground">{da.offering.perUnit(o.unit)}</span>
                      </TableCell>
                      <TableCell>{o.submittedAt ? formatDateTime(o.submittedAt) : "–"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}
    </>
  );
}
