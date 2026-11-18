"use server";

/**
 * Server actions for the association area. Thin: read form data, call the
 * supply service, map errors to a FormState, redirect on success.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isDomainError } from "@/lib/errors";
import {
  addChannel,
  addLocation,
  archiveChannel,
  archiveLocation,
  archiveOffering,
  completeOnboardingStep,
  createCustomOffering,
  createStandardOffering,
  getAssociationOverview,
  getOffering,
  saveAssociationIdentity,
  saveAssociationProfile,
  saveIndustryExclusions,
  submitAssociationForReview,
  updateOffering,
} from "@/modules/associations/service";
import type {
  AssociationIdentityInput,
  AssociationProfileInput,
  ChannelInput,
  CustomOfferingInput,
  ExclusionsInput,
  LocationInput,
  StandardOfferingInput,
} from "@/modules/associations/validation";
import { da } from "@/messages/da";
import { formStateFromError, formValues, type FormState } from "@/server/form-state";
import { requireOrganizationAdmin } from "@/server/session";
import { nextStepPath, type OnboardingStepSlug } from "./opsaetning/steps";

async function currentAssociation() {
  const { actor, membership } = await requireOrganizationAdmin("association");
  return { actor, organizationId: membership.organizationId };
}

/** During onboarding, saving moves on to the next step; afterwards it stays. */
async function afterSave(
  organizationId: string,
  step: OnboardingStepSlug,
  actor: Awaited<ReturnType<typeof currentAssociation>>["actor"],
): Promise<FormState> {
  revalidatePath("/forening", "layout");
  const overview = await getAssociationOverview(db, actor, organizationId);
  if (overview.organization.status === "draft") redirect(nextStepPath(step));
  return { ok: true, message: da.onboardingSteps.saved };
}

export async function saveIdentityAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData);
  try {
    await saveAssociationIdentity(db, actor, organizationId, values as unknown as AssociationIdentityInput);
  } catch (error) {
    return formStateFromError(error, values);
  }
  return afterSave(organizationId, "stamdata", actor);
}

export async function saveProfileAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData, ["memberAgeBands"]);
  try {
    await saveAssociationProfile(db, actor, organizationId, values as unknown as AssociationProfileInput);
  } catch (error) {
    return formStateFromError(error, values);
  }
  return afterSave(organizationId, "profil", actor);
}

export async function addChannelAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData);
  try {
    await addChannel(db, actor, organizationId, values as unknown as ChannelInput);
  } catch (error) {
    return formStateFromError(error, values);
  }
  revalidatePath("/forening", "layout");
  return {};
}

export async function addLocationAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData);
  try {
    await addLocation(db, actor, organizationId, values as unknown as LocationInput);
  } catch (error) {
    return formStateFromError(error, values);
  }
  revalidatePath("/forening", "layout");
  return {};
}

export async function archiveChannelAction(formData: FormData): Promise<void> {
  const { actor } = await currentAssociation();
  await archiveChannel(db, actor, String(formData.get("id")));
  revalidatePath("/forening", "layout");
}

export async function archiveLocationAction(formData: FormData): Promise<void> {
  const { actor } = await currentAssociation();
  await archiveLocation(db, actor, String(formData.get("id")));
  revalidatePath("/forening", "layout");
}

/** "Continue" on steps 3 and 4: requires at least one channel/location or offering. */
export async function continueStepAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const step = String(formData.get("step")) as "kanaler" | "produkter";
  const overview = await getAssociationOverview(db, actor, organizationId);
  if (step === "kanaler" && !overview.completeness.channelOrLocation) {
    return { error: da.onboardingSteps.channels.needOne };
  }
  if (step === "produkter" && !overview.completeness.offering) {
    return { error: da.onboardingSteps.offerings.needOne };
  }
  await completeOnboardingStep(db, actor, organizationId, step === "kanaler" ? 3 : 4);
  revalidatePath("/forening", "layout");
  redirect(nextStepPath(step));
}

export async function saveExclusionsAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData, ["industryIds"]);
  const industryIds = values.industryIds as string[];
  const expiresOn: Record<string, string | null> = {};
  for (const id of industryIds) expiresOn[id] = (values[`expiresOn.${id}`] as string | undefined) || null;
  const input: ExclusionsInput = { industryIds, expiresOn, note: {} };
  try {
    await saveIndustryExclusions(db, actor, organizationId, input);
  } catch (error) {
    return formStateFromError(error, values);
  }
  return afterSave(organizationId, "brancher", actor);
}

export async function submitForReviewAction(): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  try {
    await submitAssociationForReview(db, actor, organizationId);
  } catch (error) {
    if (isDomainError(error) && error.code === "conflict")
      return { error: da.onboardingSteps.submit.alreadySubmitted };
    return formStateFromError(error, undefined);
  }
  revalidatePath("/forening", "layout");
  redirect("/forening");
}

/** Where to go after saving an offering: back to step 4 during onboarding, else the product list. */
async function offeringsHome(
  organizationId: string,
  actor: Awaited<ReturnType<typeof currentAssociation>>["actor"],
) {
  const overview = await getAssociationOverview(db, actor, organizationId);
  return overview.organization.status === "draft" ? "/forening/opsaetning/produkter" : "/forening/produkter";
}

export async function createOfferingAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData);
  try {
    if (values.kind === "custom") {
      await createCustomOffering(db, actor, organizationId, values as unknown as CustomOfferingInput);
    } else {
      await createStandardOffering(db, actor, organizationId, values as unknown as StandardOfferingInput);
    }
  } catch (error) {
    return formStateFromError(error, values);
  }
  revalidatePath("/forening", "layout");
  redirect(await offeringsHome(organizationId, actor));
}

export async function updateOfferingAction(_state: FormState, formData: FormData): Promise<FormState> {
  const { actor, organizationId } = await currentAssociation();
  const values = formValues(formData);
  const offeringId = String(values.id);
  try {
    const offering = await getOffering(db, actor, offeringId);
    if (offering.organizationId !== organizationId) return { error: da.forms.forbidden };
    await updateOffering(db, actor, offeringId, values as unknown as CustomOfferingInput);
  } catch (error) {
    return formStateFromError(error, values);
  }
  revalidatePath("/forening", "layout");
  redirect(await offeringsHome(organizationId, actor));
}

export async function archiveOfferingAction(formData: FormData): Promise<void> {
  const { actor, organizationId } = await currentAssociation();
  const offeringId = String(formData.get("id"));
  const offering = await getOffering(db, actor, offeringId);
  if (offering.organizationId !== organizationId) return;
  await archiveOffering(db, actor, offeringId);
  revalidatePath("/forening", "layout");
  redirect(await offeringsHome(organizationId, actor));
}
