import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import {
  SelectField,
  ServerForm,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms/server-form";
import { DemoBadge, OrganizationStatusBadge } from "@/components/organization-status-badge";
import { AssociationProfileView } from "@/components/supply/association-profile-view";
import { OfferingStatusBadge } from "@/components/supply/status-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { isDomainError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { formatMoney, money } from "@/lib/money";
import { getAssociationOverview, type OfferingRow } from "@/modules/associations/service";
import { organizationStatus } from "@/modules/identity/schema";
import { getOrganization } from "@/modules/identity/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";
import { reviewAssociationAction, reviewOfferingAction, setOrganizationStatusAction } from "../../actions";

export const metadata: Metadata = { title: da.admin.associationTitle };

const statusOptions = organizationStatus.enumValues.map((value) => ({
  value,
  label: da.organizationStatus[value],
}));

type Props = PageProps<"/admin/organisationer/[id]">;

export default function AdminOrganizationPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrganizationDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrganizationDetail({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const saved = query.gemt === "1";
  const actor = await requirePlatformAdmin();
  const organization = await getOrganization(db, actor, id).catch((error: unknown) => {
    if (isDomainError(error) && error.code === "not_found") notFound();
    throw error;
  });

  const header = (
    <>
      <PageHeader
        title={organization.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {da.organizationType[organization.type]}
            <OrganizationStatusBadge status={organization.status} />
            {organization.isDemo && <DemoBadge />}
          </span>
        }
      />
      {saved && (
        <Alert variant="success">
          <AlertDescription>{da.admin.reviewDone}</AlertDescription>
        </Alert>
      )}
    </>
  );

  const statusForm = organization.type !== "platform" && (
    <Card>
      <CardHeader>
        <CardTitle>{da.admin.statusSection}</CardTitle>
      </CardHeader>
      <CardContent>
        <ServerForm action={setOrganizationStatusAction} className="max-w-md gap-4">
          <input type="hidden" name="organizationId" value={organization.id} />
          <SelectField
            name="status"
            label={da.admin.columns.status}
            required
            options={statusOptions}
            defaultValue={organization.status}
          />
          <TextField name="reason" label={da.admin.statusReason} />
          <div>
            <SubmitButton variant="outline">{da.admin.setStatus}</SubmitButton>
          </div>
        </ServerForm>
      </CardContent>
    </Card>
  );

  if (organization.type !== "association") {
    return (
      <div className="grid gap-6">
        {header}
        {statusForm}
      </div>
    );
  }

  const overview = await getAssociationOverview(db, actor, id);
  const pendingOfferings = overview.offerings.filter((o) => o.status === "pending_review");

  return (
    <div className="grid gap-6">
      {header}
      {organization.status === "pending_review" && (
        <Card className="border-warning/60">
          <CardHeader>
            <CardTitle>{da.admin.reviewSection}</CardTitle>
            {overview.profile?.submittedAt && (
              <CardDescription>
                {da.admin.submittedAt} {formatDateTime(overview.profile.submittedAt)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ServerForm action={reviewAssociationAction} className="max-w-2xl gap-4">
              <input type="hidden" name="organizationId" value={organization.id} />
              <TextAreaField
                name="note"
                label={da.admin.reviewNote}
                hint={da.admin.reviewNoteHint}
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <SubmitButton name="decision" value="approve">
                  {da.admin.approveAssociation}
                </SubmitButton>
                <SubmitButton name="decision" value="reject" variant="outline">
                  {da.admin.returnAssociation}
                </SubmitButton>
              </div>
            </ServerForm>
          </CardContent>
        </Card>
      )}

      {pendingOfferings.map((offering) => (
        <OfferingReviewCard key={offering.id} offering={offering} />
      ))}

      <AssociationProfileView overview={overview} />
      {statusForm}
    </div>
  );
}

function OfferingReviewCard({ offering }: { offering: OfferingRow }) {
  return (
    <Card id={`produkt-${offering.id}`} className="border-warning/60">
      <CardHeader>
        <CardDescription className="flex flex-wrap items-center gap-2">
          {offering.kind === "standard" ? da.offering.standard : da.offering.custom} · {offering.categoryName}
          <OfferingStatusBadge status={offering.status} />
        </CardDescription>
        <CardTitle>{offering.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid gap-1 text-sm">
          <div>
            <dt className="inline text-muted-foreground">{da.offering.description}: </dt>
            <dd className="inline whitespace-pre-line">{offering.description}</dd>
          </div>
          <div>
            <dt className="inline text-muted-foreground">{da.admin.columns.price}: </dt>
            <dd className="inline tabular-nums">
              {formatMoney(money(offering.priceMinor))} {da.offering.perUnit(offering.unit)}
            </dd>
          </div>
          {offering.capacity !== null && (
            <div>
              <dt className="inline text-muted-foreground">{da.offering.capacity}: </dt>
              <dd className="inline">{offering.capacity}</dd>
            </div>
          )}
          {offering.evidenceRequirements && (
            <div>
              <dt className="inline text-muted-foreground">{da.offering.evidence}: </dt>
              <dd className="inline">{offering.evidenceRequirements}</dd>
            </div>
          )}
        </dl>
        <ServerForm action={reviewOfferingAction} className="max-w-2xl gap-4">
          <input type="hidden" name="offeringId" value={offering.id} />
          <input type="hidden" name="organizationId" value={offering.organizationId} />
          <TextField
            name="priceMinor"
            label={da.admin.priceOverride}
            hint={da.admin.priceOverrideHint}
            inputMode="decimal"
            className="max-w-xs"
          />
          <TextAreaField name="note" label={da.admin.reviewNote} hint={da.admin.reviewNoteHint} rows={2} />
          <div className="flex flex-wrap gap-2">
            <SubmitButton name="decision" value="approve">
              {da.admin.approveOffering}
            </SubmitButton>
            <SubmitButton name="decision" value="reject" variant="outline">
              {da.admin.rejectOffering}
            </SubmitButton>
          </div>
        </ServerForm>
      </CardContent>
    </Card>
  );
}
