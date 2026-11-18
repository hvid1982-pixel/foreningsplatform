import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ServerForm, SubmitButton, TextField } from "@/components/forms/server-form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { configDefinitions } from "@/modules/config/definitions";
import { listConfig, type ResolvedConfig } from "@/modules/config/service";
import { da } from "@/messages/da";
import { requirePlatformAdmin } from "@/server/session";
import { setConfigAction } from "../actions";

export const metadata: Metadata = { title: da.admin.configTitle };

export default function AdminConfigPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConfigTable />
    </Suspense>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return da.admin.configNotSet;
  if (typeof value === "boolean") return value ? da.common.yes : da.common.no;
  return String(value);
}

function StatusBadge({ status }: { status: ResolvedConfig["status"] }) {
  if (status === "approved") return <Badge variant="success">{da.admin.configApproved}</Badge>;
  if (status === "proposed_default") return <Badge variant="warning">{da.admin.configNotApproved}</Badge>;
  return <Badge variant="outline">{da.admin.configCodeDefault}</Badge>;
}

async function ConfigTable() {
  const actor = await requirePlatformAdmin();
  const rows = await listConfig(db, actor);
  const cols = da.admin.columns;
  return (
    <>
      <PageHeader title={da.admin.configTitle} description={da.admin.configIntro} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{cols.rule}</TableHead>
            <TableHead>{cols.value}</TableHead>
            <TableHead>{cols.ruleStatus}</TableHead>
            <TableHead>{cols.source}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const definition = configDefinitions[row.key];
            return (
              <TableRow key={row.key}>
                <TableCell>
                  <div className="font-medium">{definition.label}</div>
                  <div className="text-xs text-muted-foreground">{definition.description}</div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatValue(row.value)}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground underline">
                      {da.admin.configEdit}
                    </summary>
                    <ServerForm action={setConfigAction} className="mt-3 min-w-64 gap-3">
                      <input type="hidden" name="key" value={row.key} />
                      <TextField
                        name="value"
                        label={da.admin.configNewValue}
                        hint={
                          typeof definition.defaultValue === "boolean"
                            ? "true / false"
                            : definition.defaultValue === null || row.value === null
                              ? da.admin.configNullHint
                              : undefined
                        }
                        defaultValue={row.value === null ? "" : String(row.value)}
                      />
                      <TextField name="note" label={da.admin.configNote} />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="approved" defaultChecked={row.status === "approved"} />
                        {da.admin.configMarkApproved}
                      </label>
                      <div>
                        <SubmitButton variant="outline">{da.admin.configSave}</SubmitButton>
                      </div>
                    </ServerForm>
                  </details>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{definition.source}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
