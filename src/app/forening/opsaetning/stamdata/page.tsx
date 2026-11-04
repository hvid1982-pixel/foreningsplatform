import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import {
  RadioGroupField,
  SelectField,
  ServerForm,
  SubmitButton,
  TextField,
} from "@/components/forms/server-form";
import { BookingHelp } from "@/components/supply/booking-help";
import { danishRegion } from "@/modules/associations/schema";
import { da } from "@/messages/da";
import { loadBookingUrl, loadCurrentAssociation } from "@/server/association";
import { saveIdentityAction } from "../../actions";
import { PreviousStepLink, saveLabel, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.stamdata.title };

const t = da.onboardingSteps.identity;
const regionOptions = danishRegion.enumValues.map((value) => ({ value, label: da.region[value] }));

export default function IdentityStepPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IdentityStep />
    </Suspense>
  );
}

async function IdentityStep() {
  const [{ actor, overview }, bookingUrl] = await Promise.all([loadCurrentAssociation(), loadBookingUrl()]);
  const { organization, profile: p } = overview;
  return (
    <>
      <StepHeader step="stamdata" intro={t.intro} />
      <BookingHelp url={bookingUrl} />
      <ServerForm action={saveIdentityAction} className="max-w-2xl">
        <TextField name="name" label={t.name} required defaultValue={organization.name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="cvr" label={t.cvr} hint={t.cvrHint} inputMode="numeric" defaultValue={p?.cvr} />
          <TextField
            name="associationKind"
            label={t.kind}
            hint={t.kindHint}
            defaultValue={p?.associationKind}
          />
        </div>
        <TextField
          name="addressLine"
          label={t.address}
          required
          autoComplete="street-address"
          defaultValue={p?.addressLine}
        />
        <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
          <TextField
            name="postalCode"
            label={t.postalCode}
            required
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={p?.postalCode}
          />
          <TextField
            name="city"
            label={t.city}
            required
            autoComplete="address-level2"
            defaultValue={p?.city}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="municipality" label={t.municipality} defaultValue={p?.municipality} />
          <SelectField
            name="region"
            label={t.region}
            required
            options={regionOptions}
            defaultValue={p?.region}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="contactName"
            label={t.contactName}
            required
            autoComplete="name"
            defaultValue={p?.contactName ?? actor.name}
          />
          <TextField
            name="contactEmail"
            label={t.contactEmail}
            required
            type="email"
            autoComplete="email"
            defaultValue={p?.contactEmail ?? actor.email}
          />
        </div>
        <TextField
          name="contactPhone"
          label={t.contactPhone}
          type="tel"
          autoComplete="tel"
          className="max-w-xs"
          defaultValue={p?.contactPhone}
        />
        <RadioGroupField
          name="vatRegistered"
          label={t.vat}
          options={[
            { value: "yes", label: t.vatYes },
            { value: "no", label: t.vatNo },
            { value: "unknown", label: t.vatUnknown },
          ]}
          defaultValue={p?.vatRegistered === true ? "yes" : p?.vatRegistered === false ? "no" : "unknown"}
        />
        <p className="-mt-3 text-xs text-muted-foreground">{t.vatHint}</p>
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{saveLabel(organization.status === "draft")}</SubmitButton>
          <PreviousStepLink step="stamdata" />
        </div>
      </ServerForm>
    </>
  );
}
