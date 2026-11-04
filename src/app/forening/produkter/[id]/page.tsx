import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { OfferingStatusBadge } from "@/components/supply/status-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { listActiveCategories, listProductTemplates } from "@/modules/catalog/service";
import { da } from "@/messages/da";
import { loadCurrentAssociation } from "@/server/association";
import { archiveOfferingAction } from "../../actions";
import { OfferingForm } from "../offering-form";

export const metadata: Metadata = { title: da.offering.editTitle };

export default function EditOfferingPage({ params }: PageProps<"/forening/produkter/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditOffering params={params} />
    </Suspense>
  );
}

async function EditOffering({ params }: { params: PageProps<"/forening/produkter/[id]">["params"] }) {
  const { id } = await params;
  const [{ overview }, templates, categories] = await Promise.all([
    loadCurrentAssociation(),
    listProductTemplates(db, { includeArchived: true }),
    listActiveCategories(db),
  ]);
  const offering = overview.offerings.find((o) => o.id === id);
  if (!offering) notFound();
  const template = templates.find((t) => t.id === offering.templateId);

  return (
    <>
      <PageHeader
        title={offering.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {offering.kind === "standard" ? da.offering.standard : da.offering.custom} ·{" "}
            {offering.categoryName}
            <OfferingStatusBadge status={offering.status} />
          </span>
        }
      />
      {offering.reviewNote && (
        <Alert variant={offering.status === "rejected" ? "destructive" : "info"} className="mb-6 max-w-2xl">
          <AlertTitle>{da.offering.reviewNote}</AlertTitle>
          <AlertDescription>{offering.reviewNote}</AlertDescription>
        </Alert>
      )}
      <OfferingForm
        kind={offering.kind}
        template={template}
        offering={offering}
        categories={categories}
        channels={overview.channels}
        locations={overview.locations}
      />
      <form action={archiveOfferingAction} className="mt-10 max-w-2xl border-t pt-6">
        <input type="hidden" name="id" value={offering.id} />
        <p className="mb-3 text-sm text-muted-foreground">{da.offering.archiveConfirm}</p>
        <Button type="submit" variant="outline">
          {da.offering.archive}
        </Button>
      </form>
    </>
  );
}
