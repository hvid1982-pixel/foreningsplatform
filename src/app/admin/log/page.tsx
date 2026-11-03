import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { listAuditEvents } from "@/modules/audit/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";

export const metadata: Metadata = { title: da.admin.auditTitle };

export default function AdminAuditLogPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuditTable />
    </Suspense>
  );
}

async function AuditTable() {
  const actor = await requirePlatformAdmin();
  const events = await listAuditEvents(db, actor, { limit: 200 });
  const cols = da.admin.columns;
  return (
    <>
      <PageHeader title={da.admin.auditTitle} description={da.admin.auditIntro} />
      {events.length === 0 ? (
        <EmptyState title={da.admin.auditEmpty} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{cols.time}</TableHead>
              <TableHead>{cols.action}</TableHead>
              <TableHead>{cols.entity}</TableHead>
              <TableHead>{cols.actor}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(event.occurredAt)}</TableCell>
                <TableCell className="font-mono text-xs">{event.action}</TableCell>
                <TableCell className="font-mono text-xs">
                  {event.entityType}
                  {event.entityId ? ` · ${event.entityId.slice(0, 8)}` : ""}
                </TableCell>
                <TableCell>{event.actorEmail ?? da.admin.system}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
