import Link from "next/link";
import { Suspense } from "react";
import { da } from "@/messages/da";
import { UserNav } from "./user-nav";

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          {da.app.name}
        </Link>
        {/* The user part reads the session, so it streams in behind a boundary. */}
        <Suspense fallback={<div className="h-8 w-32" aria-hidden />}>
          <UserNav />
        </Suspense>
      </div>
    </header>
  );
}
