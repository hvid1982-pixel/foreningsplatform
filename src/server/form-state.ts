/**
 * Shared shape for server action results, and mapping of domain errors to it.
 * Actions return a FormState; `<ServerForm>` shows the messages.
 */
import { isDomainError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { da } from "@/messages/da";

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values, so fields keep what the user typed after an error. */
  values?: Record<string, string | string[]>;
};

/** FormData → plain object. Repeated names (checkbox groups) become arrays. */
export function formValues(
  formData: FormData,
  arrayFields: string[] = [],
): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value !== "string") continue;
    if (arrayFields.includes(key)) {
      values[key] = [...((values[key] as string[] | undefined) ?? []), value];
    } else {
      values[key] = value;
    }
  }
  for (const key of arrayFields) values[key] ??= [];
  return values;
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/** Turns a thrown error into a FormState. Unknown errors are logged. */
export function formStateFromError(
  error: unknown,
  values: FormState["values"],
  messages: Partial<Record<string, string>> = {},
): FormState {
  if (isDomainError(error)) {
    if (error.code === "validation") {
      const details = (error.details ?? {}) as Flattened;
      const fieldErrors: Record<string, string> = {};
      for (const [field, list] of Object.entries(details.fieldErrors ?? {})) {
        if (list?.[0]) fieldErrors[field] = list[0];
      }
      return {
        error: messages.validation ?? details.formErrors?.[0] ?? da.forms.fixErrors,
        fieldErrors,
        values,
      };
    }
    if (error.code === "forbidden") return { error: da.forms.forbidden, values };
    if (error.code === "conflict") return { error: messages.conflict ?? da.forms.conflict, values };
    if (error.code === "not_found") return { error: da.forms.notFound, values };
  }
  logger.error({ err: error }, "server action failed");
  return { error: da.auth.errors.generic, values };
}
