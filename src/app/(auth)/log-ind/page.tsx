import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/layout/auth-card";
import { da } from "@/messages/da";

export const metadata: Metadata = { title: da.auth.loginTitle };

export default function LoginPage() {
  return (
    <AuthCard title={da.auth.loginTitle}>
      <LoginForm />
    </AuthCard>
  );
}
