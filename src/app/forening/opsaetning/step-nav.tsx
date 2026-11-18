"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { da } from "@/messages/da";
import { onboardingSteps, stepPath } from "./steps";

/** Numbered list of the six steps; the current one is highlighted. */
export function StepNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={da.onboardingSteps.title}>
      <ol className="flex flex-wrap gap-2 text-sm">
        {onboardingSteps.map((step, index) => {
          const current = pathname === stepPath(step);
          return (
            <li key={step}>
              <Link
                href={stepPath(step)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 hover:bg-accent",
                  current && "border-primary bg-accent font-medium",
                )}
              >
                <span className="text-muted-foreground tabular-nums">{index + 1}</span>
                {da.onboardingSteps.steps[step].short}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
