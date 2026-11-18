import Link from "next/link";
import { OfferingTable } from "@/components/supply/offering-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { AssociationOverview } from "@/modules/associations/service";
import { da } from "@/messages/da";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  );
}

function Section({
  title,
  href,
  editLinks,
  children,
}: {
  title: string;
  href: string;
  editLinks?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {editLinks && (
          <Link href={href} className="text-sm underline-offset-4 hover:underline">
            {da.onboardingSteps.submit.edit}
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Read-only view of an association's profile, used for preview and by admins. */
export function AssociationProfileView({
  overview,
  editLinks = false,
  offeringHref,
}: {
  overview: AssociationOverview;
  editLinks?: boolean;
  offeringHref?: (id: string) => string;
}) {
  const { organization, profile: p, channels, locations, exclusions, offerings } = overview;
  const ti = da.onboardingSteps.identity;
  const tp = da.onboardingSteps.profile;
  const vat = p?.vatRegistered === true ? ti.vatYes : p?.vatRegistered === false ? ti.vatNo : ti.vatUnknown;
  return (
    <div className="grid gap-4">
      <Section
        title={da.onboardingSteps.steps.stamdata.title}
        href="/forening/opsaetning/stamdata"
        editLinks={editLinks}
      >
        <dl className="grid gap-2">
          <Row label={ti.name} value={organization.name} />
          <Row label={ti.cvr} value={p?.cvr} />
          <Row label={ti.kind} value={p?.associationKind} />
          <Row
            label={ti.address}
            value={
              p?.addressLine && [p.addressLine, [p.postalCode, p.city].filter(Boolean).join(" ")].join(", ")
            }
          />
          <Row label={ti.region} value={p?.region && da.region[p.region]} />
          <Row
            label={ti.contactName}
            value={
              p?.contactName &&
              `${p.contactName} · ${p.contactEmail ?? ""}${p.contactPhone ? ` · ${p.contactPhone}` : ""}`
            }
          />
          <Row label={ti.vat} value={vat} />
        </dl>
      </Section>
      <Section
        title={da.onboardingSteps.steps.profil.title}
        href="/forening/opsaetning/profil"
        editLinks={editLinks}
      >
        <dl className="grid gap-2">
          <Row
            label={tp.description}
            value={p?.description && <span className="whitespace-pre-line">{p.description}</span>}
          />
          <Row label={tp.activities} value={p?.activities} />
          <Row label={tp.memberCount} value={p?.memberCount != null ? formatNumber(p.memberCount) : null} />
          <Row label={tp.ageBands} value={p?.memberAgeBands.length ? p.memberAgeBands.join(", ") : null} />
          <Row label={tp.facilities} value={p?.facilities} />
        </dl>
      </Section>
      <Section
        title={da.onboardingSteps.steps.kanaler.title}
        href="/forening/opsaetning/kanaler"
        editLinks={editLinks}
      >
        {channels.length + locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{da.onboardingSteps.channels.none}</p>
        ) : (
          <ul className="grid gap-1 text-sm">
            {channels.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{da.channelKind[c.kind]}</span>
                {c.name && ` · ${c.name}`}
                {c.url && (
                  <>
                    {" · "}
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">
                      {c.url.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
                {c.audienceCount !== null &&
                  ` · ${formatNumber(c.audienceCount)} (${da.audienceBasis[c.audienceBasis]})`}
              </li>
            ))}
            {locations.map((l) => (
              <li key={l.id}>
                <span className="font-medium">{l.name}</span> · {da.locationKind[l.kind]}
                {l.city && ` · ${[l.addressLine, l.postalCode, l.city].filter(Boolean).join(" ")}`}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section
        title={da.onboardingSteps.steps.produkter.title}
        href="/forening/opsaetning/produkter"
        editLinks={editLinks}
      >
        {offerings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{da.association.offeringsEmpty}</p>
        ) : (
          <OfferingTable
            offerings={offerings}
            hrefFor={offeringHref ? (o) => offeringHref(o.id) : undefined}
          />
        )}
      </Section>
      <Section
        title={da.onboardingSteps.steps.brancher.title}
        href="/forening/opsaetning/brancher"
        editLinks={editLinks}
      >
        {exclusions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{da.admin.noExclusions}</p>
        ) : (
          <ul className="grid gap-1 text-sm">
            {exclusions.map((e) => (
              <li key={e.id}>
                {e.industryName}
                {e.expiresOn && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({da.onboardingSteps.exclusions.expiresOn.toLowerCase()} {e.expiresOn})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
