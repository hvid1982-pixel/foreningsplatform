import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { DemoBadge, OrganizationStatusBadge } from "@/components/organization-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { listOrganizations } from "@/modules/identity/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";

export const metadata: Metadata = { title: da.admin.organizationsTitle };

export default function AdminOrganizationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrganizationsTable />
    </Suspense>
  );
}

async function OrganizationsTable() {
  const actor = await requirePlatformAdmin();
  const organizations = await listOrganizations(db, actor);
  const cols = da.admin.columns;
  return (
    <>
      <PageHeader title={da.admin.organizationsTitle} />
      {organizations.length === 0 ? (
        <EmptyState title={da.admin.organizationsEmpty} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{cols.name}</TableHead>
              <TableHead>{cols.type}</TableHead>
              <TableHead>{cols.status}</TableHead>
              <TableHead className="text-right">{cols.members}</TableHead>
              <TableHead>{cols.created}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {org.name}
                    {org.isDemo && <DemoBadge />}
                  </span>
                </TableCell>
                <TableCell>{da.organizationType[org.type]}</TableCell>
                <TableCell>
                  <OrganizationStatusBadge status={org.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{org.memberCount}</TableCell>
                <TableCell>{formatDate(org.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
