"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { da } from "@/messages/da";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 10) {
      setError(da.auth.errors.passwordTooShort);
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      password,
      callbackURL: "/app",
    });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Alert variant="success">
        <AlertTitle>{da.auth.checkEmailTitle}</AlertTitle>
        <AlertDescription>{da.auth.checkEmailText}</AlertDescription>
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
      <FormField id="name" name="name" label={da.auth.name} autoComplete="name" required minLength={2} />
      <FormField id="email" name="email" type="email" label={da.auth.email} autoComplete="email" required />
      <FormField
        id="password"
        name="password"
        type="password"
        label={da.auth.password}
        hint={da.auth.passwordHint}
        autoComplete="new-password"
        required
        minLength={10}
      />
      <Button type="submit" disabled={pending}>
        {pending ? da.auth.submitting : da.auth.signupSubmit}
      </Button>
      <p className="text-sm">
        {da.auth.signupHasAccount}{" "}
        <Link href="/log-ind" className="text-primary underline-offset-4 hover:underline">
          {da.nav.login}
        </Link>
      </p>
    </form>
  );
}
