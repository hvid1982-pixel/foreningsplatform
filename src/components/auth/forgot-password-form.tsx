"use client";

import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { da } from "@/messages/da";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    // The response is the same whether or not the e-mail exists (no account enumeration).
    await authClient.requestPasswordReset({
      email: String(form.get("email")).trim(),
      redirectTo: "/nulstil-adgangskode",
    });
    setPending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <Alert variant="success">
        <AlertDescription>{da.auth.forgotSent}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormField id="email" name="email" type="email" label={da.auth.email} autoComplete="email" required />
      <Button type="submit" disabled={pending}>
        {pending ? da.auth.submitting : da.auth.forgotSubmit}
      </Button>
    </form>
  );
}
