import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";

/** "Book onboarding help" (spec section 3). Hidden until an admin sets the booking URL. */
export function BookingHelp({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">{da.association.bookHelpText}</span>
      <Button asChild variant="outline" size="sm">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <CalendarClock aria-hidden />
          {da.association.bookHelp}
        </a>
      </Button>
    </div>
  );
}
