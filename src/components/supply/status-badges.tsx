import { Badge } from "@/components/ui/badge";
import type { OfferingStatus } from "@/modules/associations/schema";
import { da } from "@/messages/da";

const variants: Record<OfferingStatus, "success" | "warning" | "secondary" | "outline"> = {
  approved: "success",
  pending_review: "warning",
  draft: "secondary",
  rejected: "outline",
  archived: "outline",
};

export function OfferingStatusBadge({ status }: { status: OfferingStatus }) {
  return <Badge variant={variants[status]}>{da.offeringStatus[status]}</Badge>;
}
