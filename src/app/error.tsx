"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">{da.common.errorTitle}</h1>
      <p className="mt-2 text-muted-foreground">{da.common.errorText}</p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Fejl-id: {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>{da.common.retry}</Button>
        <Button asChild variant="outline">
          <Link href="/">{da.common.home}</Link>
        </Button>
      </div>
    </div>
  );
}
