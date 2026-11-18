import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import {
  RadioGroupField,
  SelectField,
  ServerForm,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms/server-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { channelKind, locationKind } from "@/modules/associations/schema";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import {
  addChannelsAction,
  addLocationAction,
  archiveChannelAction,
  archiveLocationAction,
  continueStepAction,
  updateChannelAction,
  updateLocationAction,
} from "../../actions";
import { PreviousStepLink, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.kanaler.title };

const t = da.onboardingSteps.channels;
const channelOptions = channelKind.enumValues.map((value) => ({ value, label: da.channelKind[value] }));
const basisOptions = [
  { value: "stated", label: da.onboardingSteps.channels.basisStated },
  { value: "measured", label: da.onboardingSteps.channels.basisMeasured },
];
const locationOptions = locationKind.enumValues.map((value) => ({ value, label: da.locationKind[value] }));

export default function ChannelsStepPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ChannelsStep />
    </Suspense>
  );
}

async function ChannelsStep() {
  const { overview } = await loadCurrentAssociation();
  const { channels, locations } = overview;
  return (
    <>
      <StepHeader step="kanaler" intro={t.intro} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.channelsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.none}</p>
            ) : (
              <ul className="grid gap-2">
                {channels.map((channel) => (
                  <li key={channel.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        <span className="font-medium">{da.channelKind[channel.kind]}</span>
                        {channel.name && <> · {channel.name}</>}
                        {channel.audienceCount !== null && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {formatNumber(channel.audienceCount)} ({da.audienceBasis[channel.audienceBasis]}
                            )
                          </span>
                        )}
                      </span>
                      <form action={archiveChannelAction}>
                        <input type="hidden" name="id" value={channel.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {t.remove}
                        </Button>
                      </form>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground underline">
                        {t.edit}
                      </summary>
                      <ServerForm action={updateChannelAction} className="mt-3 gap-3">
                        <input type="hidden" name="id" value={channel.id} />
                        <SelectField
                          name="kind"
                          label={t.kind}
                          required
                          options={channelOptions}
                          defaultValue={channel.kind}
                        />
                        <TextField name="name" label={t.name} defaultValue={channel.name} />
                        <TextField name="url" label={t.url} inputMode="url" defaultValue={channel.url} />
                        <TextField
                          name="audienceCount"
                          label={t.audienceCount}
                          inputMode="numeric"
                          defaultValue={channel.audienceCount}
                        />
                        <RadioGroupField
                          name="audienceBasis"
                          label={t.audienceBasis}
                          required
                          defaultValue={channel.audienceBasis}
                          options={basisOptions}
                        />
                        <div>
                          <SubmitButton variant="outline">{t.save}</SubmitButton>
                        </div>
                      </ServerForm>
                    </details>
                  </li>
                ))}
              </ul>
            )}
            <ServerForm action={addChannelsAction} className="gap-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">{t.addChannelsIntro}</p>
              <ul className="grid gap-3">
                {channelOptions.map((option) => (
                  <li
                    key={option.value}
                    className="group rounded-md border p-3 has-[input[type=checkbox]:checked]:border-primary"
                  >
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        name="kinds"
                        value={option.value}
                        className="accent-[var(--primary)]"
                      />
                      {option.label}
                    </label>
                    <div className="mt-3 hidden gap-3 group-has-[input[type=checkbox]:checked]:grid sm:grid-cols-2">
                      <TextField name={`url.${option.value}`} label={t.url} inputMode="url" />
                      <TextField
                        name={`audienceCount.${option.value}`}
                        label={t.audienceCount}
                        inputMode="numeric"
                      />
                      <SelectField
                        name={`audienceBasis.${option.value}`}
                        label={t.audienceBasis}
                        required
                        defaultValue="stated"
                        options={basisOptions}
                      />
                      <TextField name={`name.${option.value}`} label={t.name} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{t.basisHint}</p>
              <div>
                <SubmitButton variant="outline">{t.addChannels}</SubmitButton>
              </div>
            </ServerForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.locationsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {locations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.none}</p>
            ) : (
              <ul className="grid gap-2">
                {locations.map((location) => (
                  <li key={location.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        <span className="font-medium">{location.name}</span> ·{" "}
                        {da.locationKind[location.kind]}
                        {location.city && <span className="text-muted-foreground"> · {location.city}</span>}
                      </span>
                      <form action={archiveLocationAction}>
                        <input type="hidden" name="id" value={location.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {t.remove}
                        </Button>
                      </form>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground underline">
                        {t.edit}
                      </summary>
                      <ServerForm action={updateLocationAction} className="mt-3 gap-3">
                        <input type="hidden" name="id" value={location.id} />
                        <SelectField
                          name="kind"
                          label={t.kind}
                          required
                          options={locationOptions}
                          defaultValue={location.kind}
                        />
                        <TextField name="name" label={t.locationName} required defaultValue={location.name} />
                        <TextField
                          name="addressLine"
                          label={da.onboardingSteps.identity.address}
                          defaultValue={location.addressLine}
                        />
                        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                          <TextField
                            name="postalCode"
                            label={da.onboardingSteps.identity.postalCode}
                            inputMode="numeric"
                            defaultValue={location.postalCode}
                          />
                          <TextField
                            name="city"
                            label={da.onboardingSteps.identity.city}
                            defaultValue={location.city}
                          />
                        </div>
                        <TextAreaField
                          name="description"
                          label={t.locationDescription}
                          rows={2}
                          defaultValue={location.description}
                        />
                        <div>
                          <SubmitButton variant="outline">{t.save}</SubmitButton>
                        </div>
                      </ServerForm>
                    </details>
                  </li>
                ))}
              </ul>
            )}
            <ServerForm action={addLocationAction} className="gap-4 border-t pt-4">
              <SelectField name="kind" label={t.kind} required options={locationOptions} />
              <TextField name="name" label={t.locationName} required />
              <TextField name="addressLine" label={da.onboardingSteps.identity.address} />
              <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                <TextField
                  name="postalCode"
                  label={da.onboardingSteps.identity.postalCode}
                  inputMode="numeric"
                />
                <TextField name="city" label={da.onboardingSteps.identity.city} />
              </div>
              <TextAreaField name="description" label={t.locationDescription} rows={2} />
              <div>
                <SubmitButton variant="outline">{t.addLocation}</SubmitButton>
              </div>
            </ServerForm>
          </CardContent>
        </Card>
      </div>
      <ServerForm action={continueStepAction}>
        <input type="hidden" name="step" value="kanaler" />
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{t.continue}</SubmitButton>
          <PreviousStepLink step="kanaler" />
        </div>
      </ServerForm>
    </>
  );
}
