import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthCard } from "@/components/layout/auth-card";
import { da } from "@/messages/da";

export const metadata: Metadata = { title: da.auth.signupTitle };

export default function SignupPage() {
  return (
    <AuthCard title={da.auth.signupTitle} description={da.auth.signupIntro}>
      <SignupForm />
    </AuthCard>
  );
}
