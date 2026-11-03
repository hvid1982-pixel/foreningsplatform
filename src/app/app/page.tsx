import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { homePathFor } from "@/modules/identity/policies";
import { requireActor } from "@/server/session";

/** Entry point after login: sends each user to the right dashboard. */
export default function AppEntryPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <RedirectToHome />
      </Suspense>
    </div>
  );
}

async function RedirectToHome(): Promise<never> {
  const actor = await requireActor();
  redirect(homePathFor(actor));
}
