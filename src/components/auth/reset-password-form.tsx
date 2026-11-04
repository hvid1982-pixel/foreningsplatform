"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { da } from "@/messages/da";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(params.get("error") ? da.auth.resetInvalid : null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token && !error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{da.auth.resetInvalid}</AlertDescription>
      </Alert>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password"));
    if (password.length < 10) {
      setError(da.auth.errors.passwordTooShort);
      return;
    }
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token ?? "" });
    setPending(false);
    if (error) {
      setError(da.auth.resetInvalid);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Alert variant="success">
        <AlertDescription>
          {da.auth.resetDone}{" "}
          <Link href="/log-ind" className="text-primary underline">
            {da.nav.login}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FormField
        id="password"
        name="password"
        type="password"
        label={da.auth.password}
        hint={da.auth.passwordHint}
        autoComplete="new-password"
        required
        minLength={10}
        disabled={!token}
      />
      <Button type="submit" disabled={pending || !token}>
        {pending ? da.auth.submitting : da.auth.resetSubmit}
      </Button>
    </form>
  );
}
