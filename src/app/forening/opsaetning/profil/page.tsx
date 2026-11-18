import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import {
  CheckboxGroupField,
  RadioGroupField,
  ServerForm,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms/server-form";
import {
  audienceSegmentOptions,
  genderMixOptions,
  memberAgeBandOptions,
} from "@/modules/associations/validation";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import { saveProfileAction } from "../../actions";
import { PreviousStepLink, saveLabel, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.profil.title };

const t = da.onboardingSteps.profile;
const ageOptions = memberAgeBandOptions.map((value) => ({ value, label: `${value} år` }));
const genderOptions = [
  ...genderMixOptions.map((value) => ({ value, label: da.genderMix[value] })),
  { value: "", label: t.genderMixUnknown },
];
const segmentOptions = audienceSegmentOptions.map((value) => ({ value, label: da.audienceSegment[value] }));

export default function ProfileStepPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfileStep />
    </Suspense>
  );
}

async function ProfileStep() {
  const { overview } = await loadCurrentAssociation();
  const p = overview.profile;
  return (
    <>
      <StepHeader step="profil" intro={t.intro} />
      <ServerForm action={saveProfileAction} className="max-w-2xl">
        <TextAreaField
          name="description"
          label={t.description}
          hint={t.descriptionHint}
          required
          defaultValue={p?.description}
          rows={5}
        />
        <TextAreaField name="activities" label={t.activities} defaultValue={p?.activities} rows={3} />
        <TextField
          name="memberCount"
          label={t.memberCount}
          inputMode="numeric"
          className="max-w-xs"
          defaultValue={p?.memberCount}
        />
        <CheckboxGroupField
          name="memberAgeBands"
          label={t.ageBands}
          hint={t.ageBandsHint}
          options={ageOptions}
          defaultValues={p?.memberAgeBands ?? []}
        />
        <RadioGroupField
          name="genderMix"
          label={t.genderMix}
          hint={t.genderMixHint}
          options={genderOptions}
          defaultValue={p?.genderMix ?? ""}
        />
        <TextField
          name="femaleSharePercent"
          label={t.femaleShare}
          hint={t.femaleShareHint}
          inputMode="numeric"
          className="max-w-xs"
          defaultValue={p?.femaleSharePercent}
        />
        <CheckboxGroupField
          name="audienceSegments"
          label={t.audienceSegments}
          hint={t.audienceSegmentsHint}
          options={segmentOptions}
          defaultValues={p?.audienceSegments ?? []}
        />
        <TextAreaField
          name="facilities"
          label={t.facilities}
          hint={t.facilitiesHint}
          defaultValue={p?.facilities}
          rows={3}
        />
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{saveLabel(overview.organization.status === "draft")}</SubmitButton>
          <PreviousStepLink step="profil" />
        </div>
      </ServerForm>
    </>
  );
}
