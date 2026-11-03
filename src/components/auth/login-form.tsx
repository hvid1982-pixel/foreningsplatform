"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { da } from "@/messages/da";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: "/app",
    });
    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FormField id="email" name="email" type="email" label={da.auth.email} autoComplete="email" required />
      <FormField
        id="password"
        name="password"
        type="password"
        label={da.auth.password}
        autoComplete="current-password"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? da.auth.submitting : da.auth.loginSubmit}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/glemt-adgangskode" className="text-primary underline-offset-4 hover:underline">
          {da.auth.loginForgot}
        </Link>
        <span>
          {da.auth.loginNoAccount}{" "}
          <Link href="/opret-konto" className="text-primary underline-offset-4 hover:underline">
            {da.nav.signup}
          </Link>
        </span>
      </div>
    </form>
  );
}
