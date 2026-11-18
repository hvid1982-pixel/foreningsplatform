import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ServerForm, SubmitButton } from "@/components/forms/server-form";
import { AssociationProfileView } from "@/components/supply/association-profile-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import { submitForReviewAction } from "../../actions";
import { PreviousStepLink, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.indsend.title };

const t = da.onboardingSteps.submit;

export default function SubmitStepPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SubmitStep />
    </Suspense>
  );
}

async function SubmitStep() {
  const { overview } = await loadCurrentAssociation();
  const isDraft = overview.organization.status === "draft";
  return (
    <>
      <StepHeader step="indsend" intro={t.intro} />
      {overview.missing.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>{t.missingTitle}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {overview.missing.map((key) => (
                <li key={key}>{t.missing[key]}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <AssociationProfileView overview={overview} editLinks />
      {isDraft ? (
        <ServerForm action={submitForReviewAction}>
          <div className="flex flex-wrap gap-2">
            <SubmitButton>{t.submit}</SubmitButton>
            <PreviousStepLink step="indsend" />
          </div>
        </ServerForm>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t.alreadySubmitted}{" "}
          <Link href="/forening" className="underline">
            {da.nav.associationHome}
          </Link>
        </p>
      )}
    </>
  );
}
