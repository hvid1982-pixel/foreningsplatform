import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { db } from "@/lib/db";
import { listActiveCategories } from "@/modules/catalog/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";
import { TemplateForm } from "../template-form";

export const metadata: Metadata = { title: da.admin.newTemplate };

export default function NewTemplatePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewTemplate />
    </Suspense>
  );
}

async function NewTemplate() {
  await requirePlatformAdmin();
  const categories = await listActiveCategories(db);
  return (
    <>
      <PageHeader title={da.admin.newTemplate} />
      <TemplateForm categories={categories} />
    </>
  );
}
