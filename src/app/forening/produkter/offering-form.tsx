import {
  CheckboxGroupField,
  RadioGroupField,
  SelectField,
  ServerForm,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms/server-form";
import { formatMinorAsKronerInput, formatMoney, money } from "@/lib/money";
import type {
  AssociationChannel,
  AssociationLocation,
  AssociationOffering,
} from "@/modules/associations/schema";
import { offeringUnitOptions, seasonOptions } from "@/modules/associations/validation";
import type { CatalogCategory, ProductTemplate } from "@/modules/catalog/schema";
import { da } from "@/messages/da";
import { createOfferingAction, updateOfferingAction } from "../actions";

const t = da.offering;

/**
 * Form for a standard offering (based on `template`) or a custom offering.
 * With `offering` it edits; without it creates.
 */
export function OfferingForm({
  kind,
  template,
  offering,
  categories,
  channels,
  locations,
}: {
  kind: "standard" | "custom";
  template?: ProductTemplate;
  offering?: AssociationOffering;
  categories: CatalogCategory[];
  channels: AssociationChannel[];
  locations: AssociationLocation[];
}) {
  const channelOptions = channels.map((c) => ({
    value: c.id,
    label: [da.channelKind[c.kind], c.name].filter(Boolean).join(" · "),
  }));
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.name }));
  const unitOptions = offeringUnitOptions.map((value) => ({ value, label: da.offeringUnit[value] }));
  const seasonChoices = seasonOptions.map((value) => ({ value, label: da.season[value] }));
  const price = offering?.priceMinor ?? template?.suggestedPriceMinor;

  return (
    <ServerForm action={offering ? updateOfferingAction : createOfferingAction} className="max-w-2xl">
      <input type="hidden" name="kind" value={kind} />
      {offering && <input type="hidden" name="id" value={offering.id} />}
      {template && <input type="hidden" name="templateId" value={template.id} />}

      {template && (
        <div className="grid gap-2 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{template.name}</p>
          <p>{template.description}</p>
          <p>
            <span className="text-muted-foreground">{t.minimumDeliverables}: </span>
            {template.minimumDeliverables}
          </p>
          <p>
            <span className="text-muted-foreground">{t.evidence}: </span>
            {template.evidenceRequirements}
          </p>
        </div>
      )}

      <TextField
        name="title"
        label={t.title}
        hint={t.titleHint}
        required
        defaultValue={offering?.title ?? template?.name}
      />
      <TextAreaField
        name="description"
        label={t.description}
        required
        defaultValue={offering?.description ?? template?.description}
      />
      {kind === "custom" && (
        <>
          <CheckboxGroupField
            name="categoryIds"
            label={t.categories}
            hint={t.categoriesHint}
            required
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            defaultValues={offering?.categoryIds ?? []}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="unitCode"
              label={t.unit}
              hint={t.unitHint}
              required
              options={unitOptions}
              defaultValue={offering?.unitCode}
            />
            <TextField
              name="unit"
              label={t.unitOther}
              hint={t.unitOtherHint}
              defaultValue={offering?.unitCode === "other" ? offering.unit : undefined}
            />
          </div>
        </>
      )}
      <TextField
        name="priceMinor"
        label={t.price}
        required
        inputMode="decimal"
        className="max-w-xs"
        hint={
          template
            ? `${t.priceRange(
                formatMoney(money(template.priceMinMinor)),
                formatMoney(money(template.suggestedPriceMinor)),
                formatMoney(money(template.priceMaxMinor)),
              )} ${t.priceHint}`
            : t.priceHint
        }
        defaultValue={price !== undefined ? formatMinorAsKronerInput(price) : undefined}
      />
      <TextField
        name="capacity"
        label={t.capacity}
        hint={t.capacityHint}
        inputMode="numeric"
        className="max-w-xs"
        defaultValue={offering?.capacity}
      />
      <RadioGroupField
        name="season"
        label={t.season}
        hint={t.seasonHint}
        required
        options={seasonChoices}
        defaultValue={offering?.season ?? "year_round"}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="availableFrom"
          label={t.availableFrom}
          hint={t.customDatesHint}
          type="date"
          defaultValue={offering?.availableFrom}
        />
        <TextField
          name="availableTo"
          label={t.availableTo}
          hint={t.customDatesHint}
          type="date"
          defaultValue={offering?.availableTo}
        />
      </div>
      <TextField
        name="availabilityNote"
        label={t.availabilityNote}
        defaultValue={offering?.availabilityNote}
      />
      {channelOptions.length > 0 && (
        <CheckboxGroupField
          name="channelIds"
          label={t.channels}
          hint={t.channelsHint}
          options={channelOptions}
          defaultValues={offering?.channelIds ?? []}
        />
      )}
      {locationOptions.length > 0 && (
        <CheckboxGroupField
          name="locationIds"
          label={t.locations}
          hint={t.locationsHint}
          options={locationOptions}
          defaultValues={offering?.locationIds ?? []}
        />
      )}
      <TextField
        name="locationNote"
        label={t.locationNote}
        hint={t.locationNoteHint}
        defaultValue={offering?.locationNote}
      />
      {kind === "custom" && (
        <TextAreaField
          name="evidenceRequirements"
          label={t.evidence}
          hint={t.evidenceHint}
          required
          rows={3}
          defaultValue={offering?.evidenceRequirements}
        />
      )}
      {offering && kind === "custom" && <p className="text-xs text-muted-foreground">{t.repriceNotice}</p>}
      <div>
        <SubmitButton>{offering ? t.save : t.create}</SubmitButton>
      </div>
    </ServerForm>
  );
}
