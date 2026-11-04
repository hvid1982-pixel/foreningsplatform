"use client";

import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";
import { createOrganizationAction, type CreateOrganizationState } from "./actions";

const options = [
  { value: "association", label: da.onboarding.association, hint: da.onboarding.associationHint },
  { value: "company", label: da.onboarding.company, hint: da.onboarding.companyHint },
] as const;

export function CreateOrganizationForm() {
  const [state, formAction, pending] = useActionState<CreateOrganizationState, FormData>(
    createOrganizationAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-medium">{da.onboarding.typeLabel}</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-accent"
          >
            <input
              type="radio"
              name="type"
              value={option.value}
              required
              className="mt-1 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-medium">{option.label}</span>
              <span className="block text-sm text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
        {state.fieldErrors?.type && <p className="text-sm text-destructive">{state.fieldErrors.type}</p>}
      </fieldset>
      <FormField
        id="name"
        name="name"
        label={da.onboarding.nameLabel}
        required
        minLength={2}
        maxLength={120}
        error={state.fieldErrors?.name}
      />
      <Button type="submit" disabled={pending}>
        {pending ? da.auth.submitting : da.onboarding.submit}
      </Button>
    </form>
  );
}
