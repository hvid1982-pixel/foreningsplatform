import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { OfferingTable } from "@/components/supply/offering-table";
import { Button } from "@/components/ui/button";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";

export const metadata: Metadata = { title: da.offering.listTitle };

export default function OfferingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Offerings />
    </Suspense>
  );
}

async function Offerings() {
  const { overview } = await loadCurrentAssociation();
  return (
    <>
      <PageHeader
        title={da.offering.listTitle}
        description={da.offering.listIntro}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/forening/produkter/ny">{da.offering.addStandard}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/forening/produkter/ny?type=eget">{da.offering.addCustom}</Link>
            </Button>
          </div>
        }
      />
      {overview.offerings.length === 0 ? (
        <EmptyState title={da.association.offeringsEmpty} text={da.association.offeringsEmptyText} />
      ) : (
        <OfferingTable offerings={overview.offerings} hrefFor={(o) => `/forening/produkter/${o.id}`} />
      )}
    </>
  );
}
