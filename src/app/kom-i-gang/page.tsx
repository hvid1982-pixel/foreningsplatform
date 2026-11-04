import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { canCreateOrganization, homePathFor } from "@/modules/identity/policies";
import { da } from "@/messages/da";
import { requireActor } from "@/server/session";
import { CreateOrganizationForm } from "./create-organization-form";

export const metadata: Metadata = { title: da.onboarding.title };

export default function GetStartedPage() {
  return (
    <AuthCard title={da.onboarding.title} description={da.onboarding.intro}>
      <Suspense fallback={<PageSkeleton />}>
        <GetStartedContent />
      </Suspense>
    </AuthCard>
  );
}

async function GetStartedContent() {
  const actor = await requireActor();
  // Users who already belong to an organization go straight to their dashboard.
  if (!canCreateOrganization(actor, "association")) redirect(homePathFor(actor));
  return <CreateOrganizationForm />;
}
