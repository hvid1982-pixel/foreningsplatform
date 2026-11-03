import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { DemoBadge, OrganizationStatusBadge } from "@/components/organization-status-badge";
import { db } from "@/lib/db";
import { getOrganization } from "@/modules/identity/service";
import { da } from "@/messages/da";
import { requireOrganizationAdmin } from "@/server/session";

export const metadata: Metadata = { title: da.company.dashboardTitle };

export default function CompanyDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <CompanyDashboard />
      </Suspense>
    </div>
  );
}

async function CompanyDashboard() {
  const { actor, membership } = await requireOrganizationAdmin("company");
  const organization = await getOrganization(db, actor, membership.organizationId);
  return (
    <>
      <PageHeader
        title={organization.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {da.company.dashboardTitle}
            <OrganizationStatusBadge status={organization.status} />
            {organization.isDemo && <DemoBadge />}
          </span>
        }
      />
      <EmptyState title={da.company.emptyCampaigns} text={da.company.emptyCampaignsText} />
    </>
  );
}
