import { Inbox } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <Inbox className="mb-3 size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
