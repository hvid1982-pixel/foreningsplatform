import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthCard } from "@/components/layout/auth-card";
import { da } from "@/messages/da";

export const metadata: Metadata = { title: da.auth.resetTitle };

export default function ResetPasswordPage() {
  return (
    <AuthCard title={da.auth.resetTitle}>
      {/* The token comes from the query string, which is request-time data. */}
      <Suspense fallback={<p className="text-sm text-muted-foreground">{da.common.loading}</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
