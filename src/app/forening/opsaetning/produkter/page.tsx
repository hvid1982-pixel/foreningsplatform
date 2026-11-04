import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ServerForm, SubmitButton } from "@/components/forms/server-form";
import { OfferingTable } from "@/components/supply/offering-table";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import { continueStepAction } from "../../actions";
import { PreviousStepLink, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.produkter.title };

const t = da.onboardingSteps.offerings;

export default function OfferingsStepPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OfferingsStep />
    </Suspense>
  );
}

async function OfferingsStep() {
  const { overview } = await loadCurrentAssociation();
  return (
    <>
      <StepHeader step="produkter" intro={t.intro} />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/forening/produkter/ny">{da.offering.addStandard}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/forening/produkter/ny?type=eget">{da.offering.addCustom}</Link>
        </Button>
      </div>
      {overview.offerings.length === 0 ? (
        <EmptyState title={da.association.offeringsEmpty} />
      ) : (
        <OfferingTable offerings={overview.offerings} hrefFor={(o) => `/forening/produkter/${o.id}`} />
      )}
      <ServerForm action={continueStepAction}>
        <input type="hidden" name="step" value="produkter" />
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{t.continue}</SubmitButton>
          <PreviousStepLink step="produkter" />
        </div>
      </ServerForm>
    </>
  );
}
