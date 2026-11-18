import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { loadCurrentAssociation } from "@/server/association";
import { resumeStep, stepPath } from "./steps";

/** Resumes onboarding at the furthest saved step. */
export default function OnboardingIndexPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Resume />
    </Suspense>
  );
}

async function Resume(): Promise<never> {
  const { overview } = await loadCurrentAssociation();
  redirect(
    overview.organization.status === "draft"
      ? stepPath(resumeStep(overview.profile?.onboardingStep ?? 1))
      : stepPath("stamdata"),
  );
}
