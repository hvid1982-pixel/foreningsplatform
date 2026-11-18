import {
  SelectField,
  ServerForm,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms/server-form";
import { formatMinorAsKronerInput } from "@/lib/money";
import type { CatalogCategory, ProductTemplate } from "@/modules/catalog/schema";
import { da } from "@/messages/da";
import { saveTemplateAction } from "../actions";

export function TemplateForm({
  template,
  categories,
}: {
  template?: ProductTemplate;
  categories: CatalogCategory[];
}) {
  const kr = (v?: number) => (v === undefined ? undefined : formatMinorAsKronerInput(v));
  return (
    <ServerForm action={saveTemplateAction} className="max-w-2xl">
      {template && <input type="hidden" name="id" value={template.id} />}
      <SelectField
        name="categoryId"
        label={da.offering.category}
        required
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        defaultValue={template?.categoryId}
      />
      <TextField name="name" label={da.admin.columns.name} required defaultValue={template?.name} />
      <TextAreaField
        name="description"
        label={da.offering.description}
        required
        defaultValue={template?.description}
        rows={3}
      />
      <TextField
        name="unit"
        label={da.offering.unit}
        hint={da.offering.unitHint}
        required
        className="max-w-xs"
        defaultValue={template?.unit}
      />
      <TextAreaField
        name="minimumDeliverables"
        label={da.offering.minimumDeliverables}
        required
        defaultValue={template?.minimumDeliverables}
        rows={2}
      />
      <TextAreaField
        name="evidenceRequirements"
        label={da.offering.evidence}
        required
        defaultValue={template?.evidenceRequirements}
        rows={2}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          name="priceMinMinor"
          label={da.admin.priceMin}
          required
          inputMode="decimal"
          defaultValue={kr(template?.priceMinMinor)}
        />
        <TextField
          name="suggestedPriceMinor"
          label={da.admin.priceSuggested}
          required
          inputMode="decimal"
          defaultValue={kr(template?.suggestedPriceMinor)}
        />
        <TextField
          name="priceMaxMinor"
          label={da.admin.priceMax}
          required
          inputMode="decimal"
          defaultValue={kr(template?.priceMaxMinor)}
        />
      </div>
      <TextField name="note" label={da.admin.changeNote} />
      <div>
        <SubmitButton>{da.offering.save}</SubmitButton>
      </div>
    </ServerForm>
  );
}
