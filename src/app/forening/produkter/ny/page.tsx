import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatMoney, money } from "@/lib/money";
import { listActiveCategories, listProductTemplates } from "@/modules/catalog/service";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import { OfferingForm } from "../offering-form";

export const metadata: Metadata = { title: da.offering.newStandardTitle };

export default function NewOfferingPage({ searchParams }: PageProps<"/forening/produkter/ny">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewOffering searchParams={searchParams} />
    </Suspense>
  );
}

async function NewOffering({
  searchParams,
}: {
  searchParams: PageProps<"/forening/produkter/ny">["searchParams"];
}) {
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type : undefined;
  const templateId = typeof params.skabelon === "string" ? params.skabelon : undefined;
  const [{ overview }, templates, categories] = await Promise.all([
    loadCurrentAssociation(),
    listProductTemplates(db),
    listActiveCategories(db),
  ]);
  const shared = { categories, channels: overview.channels, locations: overview.locations };

  if (type === "eget") {
    return (
      <>
        <PageHeader title={da.offering.newCustomTitle} description={da.offering.customIntro} />
        <OfferingForm kind="custom" {...shared} />
      </>
    );
  }

  const template = templates.find((t) => t.id === templateId);
  if (template) {
    return (
      <>
        <PageHeader title={da.offering.newStandardTitle} />
        <OfferingForm kind="standard" template={template} {...shared} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={da.offering.chooseTemplateTitle} description={da.offering.chooseTemplateIntro} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/forening/produkter/ny?skabelon=${t.id}`}
            className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardDescription>{t.categoryName}</CardDescription>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="text-sm tabular-nums">
                  {formatMoney(money(t.priceMinMinor))} – {formatMoney(money(t.priceMaxMinor))}{" "}
                  <span className="text-muted-foreground">{da.offering.perUnit(t.unit)}</span>
                </p>
              </CardHeader>
            </Card>
          </Link>
        ))}
        <Link
          href="/forening/produkter/ny?type=eget"
          className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Card className="h-full border-dashed transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base">{da.offering.addCustom}</CardTitle>
              <p className="text-sm text-muted-foreground">{da.offering.customIntro}</p>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </>
  );
}
