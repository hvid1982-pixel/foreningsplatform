"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isDomainError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createOrganization } from "@/modules/identity/service";
import { createOrganizationSchema } from "@/modules/identity/validation";
import { da } from "@/messages/da";
import { requireActor } from "@/server/session";

export type CreateOrganizationState = {
  error?: string;
  fieldErrors?: Partial<Record<"type" | "name", string>>;
};

export async function createOrganizationAction(
  _previous: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  const actor = await requireActor();
  const parsed = createOrganizationSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { type: fields.type?.[0], name: fields.name?.[0] } };
  }

  let destination: string;
  try {
    const organization = await createOrganization(db, actor, parsed.data);
    destination = organization.type === "association" ? "/forening" : "/virksomhed";
  } catch (error) {
    if (isDomainError(error) && error.code === "conflict") {
      return { error: da.onboarding.errors.alreadyMember };
    }
    logger.error({ err: error, module: "identity" }, "createOrganization failed");
    return { error: da.auth.errors.generic };
  }
  redirect(destination);
}
