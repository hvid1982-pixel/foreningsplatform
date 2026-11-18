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
  addChannelAction,
  addLocationAction,
  archiveChannelAction,
  archiveLocationAction,
  continueStepAction,
} from "../../actions";
import { PreviousStepLink, StepHeader } from "../step-header";

export const metadata: Metadata = { title: da.onboardingSteps.steps.kanaler.title };

const t = da.onboardingSteps.channels;
const channelOptions = channelKind.enumValues.map((value) => ({ value, label: da.channelKind[value] }));
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
                  <li
                    key={channel.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">{da.channelKind[channel.kind]}</span>
                      {channel.name && <> · {channel.name}</>}
                      {channel.audienceCount !== null && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatNumber(channel.audienceCount)} ({da.audienceBasis[channel.audienceBasis]})
                        </span>
                      )}
                    </span>
                    <form action={archiveChannelAction}>
                      <input type="hidden" name="id" value={channel.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {t.remove}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <ServerForm action={addChannelAction} className="gap-4 border-t pt-4">
              <SelectField name="kind" label={t.kind} required options={channelOptions} />
              <TextField name="name" label={t.name} />
              <TextField name="url" label={t.url} inputMode="url" />
              <TextField name="audienceCount" label={t.audienceCount} inputMode="numeric" />
              <RadioGroupField
                name="audienceBasis"
                label={t.audienceBasis}
                required
                defaultValue="stated"
                options={[
                  { value: "stated", label: t.basisStated },
                  { value: "measured", label: t.basisMeasured },
                ]}
              />
              <p className="-mt-2 text-xs text-muted-foreground">{t.basisHint}</p>
              <div>
                <SubmitButton variant="outline">{t.addChannel}</SubmitButton>
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
                  <li
                    key={location.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">{location.name}</span> · {da.locationKind[location.kind]}
                      {location.city && <span className="text-muted-foreground"> · {location.city}</span>}
                    </span>
                    <form action={archiveLocationAction}>
                      <input type="hidden" name="id" value={location.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {t.remove}
                      </Button>
                    </form>
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
