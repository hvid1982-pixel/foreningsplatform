import { da } from "@/messages/da";

/** Fallback while session-dependent content streams in. */
export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{da.common.loading}</span>
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
