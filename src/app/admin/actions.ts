"use server";

/**
 * Server actions for the admin console. Every action re-checks platform admin
 * rights (requirePlatformAdmin) and the services check again.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { reviewAssociation, reviewOffering } from "@/modules/associations/service";
import type { OfferingReviewInput, ReviewDecisionInput } from "@/modules/associations/validation";
import {
  createProductTemplate,
  setProductTemplateArchived,
  updateProductTemplate,
} from "@/modules/catalog/service";
import type { ProductTemplateInput } from "@/modules/catalog/validation";
import { configDefinitions, isConfigKey } from "@/modules/config/definitions";
import { setConfigValue } from "@/modules/config/service";
import { setOrganizationStatus } from "@/modules/identity/service";
import type { OrganizationStatus } from "@/modules/identity/schema";
import { da } from "@/messages/da";
import { formStateFromError, formValues, type FormState } from "@/server/form-state";
import { requirePlatformAdmin } from "@/server/session";

const noteRequired = { validation: da.admin.reviewNoteHint };

export async function reviewAssociationAction(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePlatformAdmin();
  const values = formValues(formData);
  const organizationId = String(values.organizationId);
  try {
    await reviewAssociation(db, actor, organizationId, values as unknown as ReviewDecisionInput);
  } catch (error) {
    return formStateFromError(error, values, noteRequired);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/organisationer/${organizationId}?gemt=1`);
}

export async function reviewOfferingAction(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePlatformAdmin();
  const values = formValues(formData);
  try {
    await reviewOffering(db, actor, String(values.offeringId), values as unknown as OfferingReviewInput);
  } catch (error) {
    return formStateFromError(error, values, noteRequired);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/organisationer/${String(values.organizationId)}?gemt=1`);
}

export async function setOrganizationStatusAction(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePlatformAdmin();
  const values = formValues(formData);
  try {
    await setOrganizationStatus(db, actor, {
      organizationId: String(values.organizationId),
      status: String(values.status) as OrganizationStatus,
      reason: values.reason ? String(values.reason) : undefined,
    });
  } catch (error) {
    return formStateFromError(error, values);
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: da.admin.reviewDone };
}

export async function saveTemplateAction(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePlatformAdmin();
  const values = formValues(formData);
  const input = values as unknown as ProductTemplateInput;
  try {
    if (values.id) await updateProductTemplate(db, actor, String(values.id), input);
    else await createProductTemplate(db, actor, input);
  } catch (error) {
    return formStateFromError(error, values);
  }
  revalidatePath("/admin/katalog");
  redirect("/admin/katalog");
}

export async function setTemplateArchivedAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdmin();
  await setProductTemplateArchived(
    db,
    actor,
    String(formData.get("id")),
    formData.get("archived") === "true",
  );
  revalidatePath("/admin/katalog");
}

/** Saves a new version of a business rule. The value is parsed by the rule's own schema. */
export async function setConfigAction(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePlatformAdmin();
  const values = formValues(formData);
  const key = String(values.key);
  if (!isConfigKey(key)) return { error: da.forms.notFound };
  const raw = String(values.value ?? "").trim();
  const definition = configDefinitions[key];
  const sample = definition.defaultValue;
  let value: unknown = raw;
  if (raw === "") value = null;
  else if (typeof sample === "boolean" || raw === "true" || raw === "false") value = raw === "true";
  else if (/^-?\d+$/.test(raw)) value = Number(raw);
  try {
    await setConfigValue(db, actor, {
      key,
      value,
      status: values.approved === "on" ? "approved" : "proposed_default",
      note: values.note ? String(values.note) : undefined,
    });
  } catch (error) {
    return formStateFromError(error, values, { validation: da.forms.fixErrors });
  }
  revalidatePath("/admin/regler");
  return { ok: true, message: da.onboardingSteps.saved };
}
