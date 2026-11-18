import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/lib/db";
import { listActiveCategories, listProductTemplates } from "@/modules/catalog/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";
import { TemplateForm } from "../template-form";

export const metadata: Metadata = { title: da.admin.editTemplate };

export default function EditTemplatePage({ params }: PageProps<"/admin/katalog/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditTemplate params={params} />
    </Suspense>
  );
}

async function EditTemplate({ params }: { params: PageProps<"/admin/katalog/[id]">["params"] }) {
  const { id } = await params;
  await requirePlatformAdmin();
  const [templates, categories] = await Promise.all([
    listProductTemplates(db, { includeArchived: true }),
    listActiveCategories(db),
  ]);
  const template = templates.find((t) => t.id === id);
  if (!template) notFound();
  return (
    <>
      <PageHeader title={da.admin.editTemplate} description={template.name} />
      <TemplateForm template={template} categories={categories} />
    </>
  );
}
