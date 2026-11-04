/** The six onboarding steps (spec section 3), in order. */
export const onboardingSteps = ["stamdata", "profil", "kanaler", "produkter", "brancher", "indsend"] as const;
export type OnboardingStepSlug = (typeof onboardingSteps)[number];

export function stepPath(step: OnboardingStepSlug): string {
  return `/forening/opsaetning/${step}`;
}

export function stepNumber(step: OnboardingStepSlug): number {
  return onboardingSteps.indexOf(step) + 1;
}

export function nextStepPath(step: OnboardingStepSlug): string {
  const next = onboardingSteps[onboardingSteps.indexOf(step) + 1];
  return next ? stepPath(next) : "/forening";
}

export function previousStepPath(step: OnboardingStepSlug): string | null {
  const previous = onboardingSteps[onboardingSteps.indexOf(step) - 1];
  return previous ? stepPath(previous) : null;
}

/** The step to resume at, from the furthest saved step number (1–6). */
export function resumeStep(onboardingStep: number): OnboardingStepSlug {
  return onboardingSteps[Math.min(Math.max(onboardingStep, 1), onboardingSteps.length) - 1];
}
