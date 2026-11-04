import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ServerForm, SubmitButton } from "@/components/forms/server-form";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { listActiveIndustries } from "@/modules/catalog/service";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import { saveExclusionsAction } from "../../actions";
import { PreviousStepLink, saveLabel, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.brancher.title };

const t = da.onboardingSteps.exclusions;

export default function ExclusionsStepPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExclusionsStep />
    </Suspense>
  );
}

async function ExclusionsStep() {
  const [{ overview }, industries] = await Promise.all([loadCurrentAssociation(), listActiveIndustries(db)]);
  const current = new Map(overview.exclusions.map((e) => [e.industryId, e]));
  return (
    <>
      <StepHeader step="brancher" intro={t.intro} />
      <ServerForm action={saveExclusionsAction} className="max-w-2xl">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">{t.industries}</legend>
          {industries.map((industry) => {
            const existing = current.get(industry.id);
            return (
              <div
                key={industry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="industryIds"
                    value={industry.id}
                    defaultChecked={Boolean(existing)}
                    className="accent-[var(--primary)]"
                  />
                  {industry.name}
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t.expiresOn}
                  <Input
                    type="date"
                    name={`expiresOn.${industry.id}`}
                    defaultValue={existing?.expiresOn ?? ""}
                    className="h-8 w-40"
                    aria-label={`${t.expiresOn}: ${industry.name}`}
                  />
                </label>
              </div>
            );
          })}
        </fieldset>
        <p className="text-xs text-muted-foreground">{t.expiresOnHint}</p>
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{saveLabel(overview.organization.status === "draft")}</SubmitButton>
          <PreviousStepLink step="brancher" />
        </div>
      </ServerForm>
    </>
  );
}
