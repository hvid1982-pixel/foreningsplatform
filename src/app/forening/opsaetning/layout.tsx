import { Suspense } from "react";
import { StepNav } from "./step-nav";

export default function OnboardingLayout({ children }: LayoutProps<"/forening/opsaetning">) {
  return (
    <div className="grid gap-8">
      <Suspense>
        <StepNav />
      </Suspense>
      {children}
    </div>
  );
}
