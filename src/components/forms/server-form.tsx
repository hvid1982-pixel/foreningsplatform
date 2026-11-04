"use client";

/**
 * Forms backed by a server action returning a FormState. Field components
 * read errors and submitted values from context, so pages can lay out fields
 * freely while the error handling stays in one place.
 */
import { createContext, useActionState, useContext, useId } from "react";
import { useFormStatus } from "react-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { da } from "@/messages/da";
import type { FormState } from "@/server/form-state";

const FormStateContext = createContext<FormState>({});

export function ServerForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={cn("grid gap-5", className)} noValidate>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.ok && state.message && (
          <Alert variant="success">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

function useField(name: string, defaultValue?: string | number | null) {
  const state = useContext(FormStateContext);
  const submitted = state.values?.[name];
  const value = typeof submitted === "string" ? submitted : defaultValue == null ? "" : String(defaultValue);
  return { error: state.fieldErrors?.[name], value };
}

type FieldBase = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: Omit<FieldBase, "name"> & { id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {!required && <span className="ml-1 font-normal text-muted-foreground">({da.forms.optional})</span>}
      </Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

export function TextField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  ...props
}: FieldBase & { defaultValue?: string | number | null } & Omit<
    React.ComponentProps<"input">,
    "name" | "defaultValue"
  >) {
  const { error, value } = useField(name, defaultValue);
  const id = `field-${name}-${useId()}`;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Input
        key={value}
        id={id}
        name={name}
        defaultValue={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  rows = 4,
}: FieldBase & { defaultValue?: string | null; rows?: number }) {
  const { error, value } = useField(name, defaultValue);
  const id = `field-${name}-${useId()}`;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Textarea
        key={value}
        id={id}
        name={name}
        rows={rows}
        defaultValue={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  options,
  placeholder,
}: FieldBase & {
  defaultValue?: string | null;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  const { error, value } = useField(name, defaultValue);
  const id = `field-${name}-${useId()}`;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Select
        key={value}
        id={id}
        name={name}
        defaultValue={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
      >
        <option value="">{placeholder ?? da.forms.choose}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FieldShell>
  );
}

export function CheckboxGroupField({
  name,
  label,
  hint,
  options,
  defaultValues = [],
  className,
}: Omit<FieldBase, "required"> & {
  options: readonly { value: string; label: string }[];
  defaultValues?: readonly string[];
}) {
  const state = useContext(FormStateContext);
  const submitted = state.values?.[name];
  const checked = new Set(Array.isArray(submitted) ? submitted : defaultValues);
  const error = state.fieldErrors?.[name];
  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend className="mb-1 text-sm font-medium">
        {label} <span className="font-normal text-muted-foreground">({da.forms.optional})</span>
      </legend>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={`${option.value}-${checked.has(option.value)}`}
            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={checked.has(option.value)}
              className="accent-[var(--primary)]"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}

export function RadioGroupField({
  name,
  label,
  options,
  defaultValue,
  required,
}: FieldBase & { options: readonly { value: string; label: string }[]; defaultValue?: string | null }) {
  const { error, value } = useField(name, defaultValue);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">
        {label}
        {!required && <span className="ml-1 font-normal text-muted-foreground">({da.forms.optional})</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={`${option.value}-${value}`}
            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={value === option.value}
              className="accent-[var(--primary)]"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}

export function SubmitButton({
  children,
  variant,
  name,
  value,
}: {
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} name={name} value={value}>
      {pending ? da.auth.submitting : children}
    </Button>
  );
}
