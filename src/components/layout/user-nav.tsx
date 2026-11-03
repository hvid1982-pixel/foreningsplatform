import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { homePathFor } from "@/modules/identity/policies";
import { da } from "@/messages/da";
import { getCurrentActor } from "@/server/session";

export async function UserNav() {
  const actor = await getCurrentActor();
  if (!actor) {
    return (
      <nav aria-label={da.nav.mainNavigation} className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/log-ind">{da.nav.login}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/opret-konto">{da.nav.signup}</Link>
        </Button>
      </nav>
    );
  }
  return (
    <nav aria-label={da.nav.mainNavigation} className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {da.nav.signedInAs} <span className="font-medium text-foreground">{actor.name}</span>
      </span>
      <Button asChild variant="outline" size="sm">
        <Link href={homePathFor(actor)}>{da.nav.dashboard}</Link>
      </Button>
      <LogoutButton />
    </nav>
  );
}
