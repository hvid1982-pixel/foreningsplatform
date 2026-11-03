import { Badge } from "@/components/ui/badge";
import type { OrganizationStatus } from "@/modules/identity/schema";
import { da } from "@/messages/da";

const variants: Record<OrganizationStatus, "success" | "warning" | "secondary" | "outline"> = {
  active: "success",
  pending_review: "warning",
  draft: "secondary",
  suspended: "warning",
  archived: "outline",
};

export function OrganizationStatusBadge({ status }: { status: OrganizationStatus }) {
  return <Badge variant={variants[status]}>{da.organizationStatus[status]}</Badge>;
}

export function DemoBadge() {
  return (
    <Badge variant="warning" title="Fiktive testdata">
      {da.app.demoBadge}
    </Badge>
  );
}
