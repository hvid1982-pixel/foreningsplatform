import Link from "next/link";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";
import { onboardingSteps, previousStepPath, stepNumber, type OnboardingStepSlug } from "./steps";

export function StepHeader({ step, intro }: { step: OnboardingStepSlug; intro: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {da.onboardingSteps.stepOf(stepNumber(step), onboardingSteps.length)}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{da.onboardingSteps.steps[step].title}</h1>
      <p className="max-w-2xl text-muted-foreground">{intro}</p>
    </div>
  );
}

export function PreviousStepLink({ step }: { step: OnboardingStepSlug }) {
  const href = previousStepPath(step);
  if (!href) return null;
  return (
    <Button asChild variant="ghost">
      <Link href={href}>{da.onboardingSteps.previous}</Link>
    </Button>
  );
}

/** Label for the main button: "save and continue" while onboarding, "save" afterwards. */
export function saveLabel(isDraft: boolean): string {
  return isDraft ? da.onboardingSteps.saveAndContinue : da.onboardingSteps.save;
}
