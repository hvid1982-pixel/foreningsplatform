import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { listReviewQueue } from "@/modules/associations/service";
import { listOrganizations } from "@/modules/identity/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";

export const metadata: Metadata = { title: da.admin.dashboardTitle };

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  const actor = await requirePlatformAdmin();
  const [organizations, queue] = await Promise.all([
    listOrganizations(db, actor),
    listReviewQueue(db, actor),
  ]);
  const pending = queue.associations.length + queue.offerings.length;
  const counts = {
    association: organizations.filter((o) => o.type === "association").length,
    company: organizations.filter((o) => o.type === "company").length,
  };
  return (
    <>
      <PageHeader title={da.admin.dashboardTitle} description={da.admin.dashboardIntro} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/godkendelser"
          className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardDescription>{da.admin.reviewsTitle}</CardDescription>
              <CardTitle className="text-3xl">
                {pending}{" "}
                <span className="text-base font-normal text-muted-foreground">{da.admin.statPending}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        {(["association", "company"] as const).map((type) => (
          <Link
            key={type}
            href="/admin/organisationer"
            className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardDescription>{da.organizationType[type]}</CardDescription>
                <CardTitle className="text-3xl">
                  {counts[type]}{" "}
                  <span className="text-base font-normal text-muted-foreground">{da.admin.statTotal}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
