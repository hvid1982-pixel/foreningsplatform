import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { DemoBadge, OrganizationStatusBadge } from "@/components/organization-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { db } from "@/lib/db";
import { getOrganization } from "@/modules/identity/service";
import { da } from "@/messages/da";
import { requireOrganizationAdmin } from "@/server/session";

export const metadata: Metadata = { title: da.association.dashboardTitle };

export default function AssociationDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <AssociationDashboard />
      </Suspense>
    </div>
  );
}

async function AssociationDashboard() {
  const { actor, membership } = await requireOrganizationAdmin("association");
  const organization = await getOrganization(db, actor, membership.organizationId);
  return (
    <>
      <PageHeader
        title={organization.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {da.association.dashboardTitle}
            <OrganizationStatusBadge status={organization.status} />
            {organization.isDemo && <DemoBadge />}
          </span>
        }
      />
      {organization.status === "draft" && (
        <Alert variant="info" className="mb-6">
          <AlertDescription>{da.association.statusDraft}</AlertDescription>
        </Alert>
      )}
      <EmptyState title={da.association.emptyCampaigns} text={da.association.emptyCampaignsText} />
    </>
  );
}
