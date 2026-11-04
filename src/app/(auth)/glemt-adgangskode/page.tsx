import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthCard } from "@/components/layout/auth-card";
import { da } from "@/messages/da";

export const metadata: Metadata = { title: da.auth.forgotTitle };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title={da.auth.forgotTitle} description={da.auth.forgotIntro}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
