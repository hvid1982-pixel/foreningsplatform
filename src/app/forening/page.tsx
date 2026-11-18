import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { DemoBadge, OrganizationStatusBadge } from "@/components/organization-status-badge";
import { BookingHelp } from "@/components/supply/booking-help";
import { OfferingTable } from "@/components/supply/offering-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";
import { loadBookingUrl, loadCurrentAssociation } from "@/server/association";
import { onboardingSteps, resumeStep, stepPath } from "./opsaetning/steps";

export const metadata: Metadata = { title: da.association.dashboardTitle };

export default function AssociationDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AssociationDashboard />
    </Suspense>
  );
}

async function AssociationDashboard() {
  const [{ overview }, bookingUrl] = await Promise.all([loadCurrentAssociation(), loadBookingUrl()]);
  const { organization, profile, offerings } = overview;
  const step = profile?.onboardingStep ?? 1;
  const isDraft = organization.status === "draft";
  const statusText = {
    draft: da.association.statusDraft,
    pending_review: da.association.statusPending,
    active: da.association.statusActive,
    suspended: da.association.statusSuspended,
    archived: da.association.statusSuspended,
  }[organization.status];

  return (
    <div className="grid gap-8">
      <PageHeader
        title={organization.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {da.association.dashboardTitle}
            <OrganizationStatusBadge status={organization.status} />
            {organization.isDemo && <DemoBadge />}
          </span>
        }
        actions={
          isDraft ? (
            <Button asChild>
              <Link href={stepPath(resumeStep(step))}>
                {profile ? da.association.continueOnboarding : da.association.startOnboarding}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/forening/opsaetning/stamdata">{da.association.editProfile}</Link>
            </Button>
          )
        }
      />

      {isDraft && profile?.reviewNote ? (
        <Alert variant="destructive">
          <AlertTitle>{da.association.returnedTitle}</AlertTitle>
          <AlertDescription>{profile.reviewNote}</AlertDescription>
        </Alert>
      ) : (
        <Alert variant={organization.status === "active" ? "success" : "info"}>
          <AlertDescription>
            {statusText}
            {isDraft && (
              <span className="mt-1 block text-muted-foreground">
                {da.association.progress(Math.min(step - 1, onboardingSteps.length), onboardingSteps.length)}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <BookingHelp url={bookingUrl} />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{da.association.offeringsTitle}</h2>
          {offerings.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/forening/produkter">{da.association.manageOfferings}</Link>
            </Button>
          )}
        </div>
        {offerings.length === 0 ? (
          <EmptyState title={da.association.offeringsEmpty} text={da.association.offeringsEmptyText} />
        ) : (
          <OfferingTable offerings={offerings} hrefFor={(o) => `/forening/produkter/${o.id}`} />
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{da.association.campaignsTitle}</h2>
        <EmptyState title={da.association.emptyCampaigns} text={da.association.emptyCampaignsText} />
      </section>
    </div>
  );
}
