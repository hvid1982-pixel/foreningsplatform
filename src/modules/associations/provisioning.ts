/**
 * DEMO supply data for the seed script: a complete, active association with
 * channels, a location and approved offerings, so the marketplace has
 * something to show. Script-only; never exposed over HTTP. Idempotent: does
 * nothing if the association already has a profile.
 */
import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { productTemplates } from "@/modules/catalog/schema";
import { associationChannels, associationLocations, associationOfferings, associations } from "./schema";

export async function ensureDemoSupply(db: Database, organizationId: string): Promise<void> {
  const existing = await db.query.associations.findFirst({
    where: eq(associations.organizationId, organizationId),
  });
  if (existing) return;

  const templates = await db.select().from(productTemplates);
  const bySlug = new Map(templates.map((t) => [t.slug, t]));
  const pick = (slug: string) => {
    const template = bySlug.get(slug);
    if (!template) throw new Error(`Missing product template ${slug}`);
    return template;
  };

  await db.transaction(async (tx) => {
    await tx.insert(associations).values({
      organizationId,
      associationKind: "Idrætsforening (fodbold)",
      addressLine: "Stadionvej 1",
      postalCode: "9000",
      city: "Aalborg",
      municipality: "Aalborg",
      region: "nordjylland",
      contactName: "Demo Formand",
      contactEmail: "forening@example.com",
      description:
        "DEMO: Lokal fodboldklub med hold for børn, unge og seniorer. Alle data er opdigtede og kun til afprøvning.",
      activities: "Fodbold for U6 til senior, sommerstævne og juleafslutning.",
      memberCount: 420,
      memberAgeBands: ["0-12", "13-18", "19-30", "31-50"],
      facilities: "Klubhus, to græsbaner og én kunstgræsbane.",
      vatRegistered: false,
      onboardingStep: 6,
      submittedAt: new Date(),
      reviewedAt: new Date(),
    });
    const [facebook] = await tx
      .insert(associationChannels)
      .values({
        organizationId,
        kind: "facebook",
        name: "Boldklubben Nord (DEMO)",
        url: "https://www.facebook.com/",
        audienceCount: 1800,
        audienceBasis: "stated",
      })
      .returning();
    await tx.insert(associationChannels).values({
      organizationId,
      kind: "newsletter",
      name: "Medlemsnyt",
      audienceCount: 350,
      audienceBasis: "measured",
    });
    const [field] = await tx
      .insert(associationLocations)
      .values({
        organizationId,
        kind: "field",
        name: "Stadion Nord",
        addressLine: "Stadionvej 1",
        postalCode: "9000",
        city: "Aalborg",
      })
      .returning();

    const social = pick("social_post");
    const banner = pick("field_banner");
    const now = new Date();
    await tx.insert(associationOfferings).values([
      {
        organizationId,
        kind: "standard",
        templateId: social.id,
        categoryId: social.categoryId,
        title: "Sponsoropslag på Facebook",
        description: "Vi præsenterer jer for vores følgere med billede og link.",
        unit: social.unit,
        priceMinor: social.suggestedPriceMinor,
        capacity: 12,
        evidenceRequirements: social.evidenceRequirements,
        channelId: facebook.id,
        status: "approved",
        submittedAt: now,
        reviewedAt: now,
      },
      {
        organizationId,
        kind: "standard",
        templateId: banner.id,
        categoryId: banner.categoryId,
        title: "Banner ved kunstgræsbanen",
        description: "Banner på hegnet ved kunstgræsbanen, hvor der er kampe hver weekend.",
        unit: banner.unit,
        priceMinor: banner.suggestedPriceMinor,
        capacity: 6,
        evidenceRequirements: banner.evidenceRequirements,
        locationId: field.id,
        status: "approved",
        submittedAt: now,
        reviewedAt: now,
      },
      {
        organizationId,
        kind: "custom",
        categoryId: pick("event_title_mention").categoryId,
        title: "Navnesponsor for sommerstævnet",
        description: "Stævnet bærer jeres navn, og I får en stand på dagen. Ca. 600 deltagere og forældre.",
        unit: "stævne",
        priceMinor: 1_200_000,
        capacity: 1,
        evidenceRequirements: "Annoncering af stævnet med jeres navn og fotos fra dagen.",
        locationId: field.id,
        status: "pending_review",
        submittedAt: now,
      },
    ]);
  });
}
