import Link from "next/link";
import { OfferingStatusBadge } from "@/components/supply/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, money } from "@/lib/money";
import type { OfferingRow } from "@/modules/associations/service";
import { da } from "@/messages/da";

/** Offerings of one association. `hrefFor` makes the title a link. */
export function OfferingTable({
  offerings,
  hrefFor,
}: {
  offerings: OfferingRow[];
  hrefFor?: (offering: OfferingRow) => string;
}) {
  const cols = da.offering.columns;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{cols.title}</TableHead>
          <TableHead>{cols.category}</TableHead>
          <TableHead>{cols.kind}</TableHead>
          <TableHead className="text-right">{cols.price}</TableHead>
          <TableHead>{cols.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offerings.map((offering) => (
          <TableRow key={offering.id}>
            <TableCell className="font-medium">
              {hrefFor ? (
                <Link href={hrefFor(offering)} className="underline-offset-4 hover:underline">
                  {offering.title}
                </Link>
              ) : (
                offering.title
              )}
            </TableCell>
            <TableCell>{offering.categoryName}</TableCell>
            <TableCell>{offering.kind === "standard" ? da.offering.standard : da.offering.custom}</TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {formatMoney(money(offering.priceMinor))}{" "}
              <span className="text-xs text-muted-foreground">{da.offering.perUnit(offering.unit)}</span>
            </TableCell>
            <TableCell>
              <OfferingStatusBadge status={offering.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
