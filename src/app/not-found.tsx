import Link from "next/link";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">{da.common.notFoundTitle}</h1>
      <p className="mt-2 text-muted-foreground">{da.common.notFoundText}</p>
      <Button asChild className="mt-6">
        <Link href="/">{da.common.home}</Link>
      </Button>
    </div>
  );
}
