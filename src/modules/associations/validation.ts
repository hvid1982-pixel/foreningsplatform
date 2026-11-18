/**
 * Input schemas for the supply side, shared by server actions and services.
 * Form values arrive as strings; empty strings become null.
 */
import { z } from "zod";
import {
  emptyToNull,
  optionalDate,
  optionalInt,
  optionalText,
  optionalUrl,
  priceInKroner,
  requiredText,
} from "@/lib/validation";
import { organizationNameSchema } from "@/modules/identity/validation";
import { audienceBasis, channelKind, danishRegion, locationKind } from "./schema";

export const memberAgeBandOptions = ["0-12", "13-18", "19-30", "31-50", "51-65", "66+"] as const;
export const genderMixOptions = ["mostly_female", "mostly_male", "mixed"] as const;
export const audienceSegmentOptions = [
  "children_youth",
  "parents_families",
  "adult_amateurs",
  "seniors",
  "elite",
  "volunteers",
  "spectators",
] as const;

/**
 * Standard units, so that companies can compare offerings across
 * associations. "other" lets the association write its own unit.
 */
export const offeringUnitOptions = [
  "post",
  "week",
  "month",
  "season",
  "year",
  "event",
  "match",
  "piece",
  "other",
] as const;
export type OfferingUnitCode = (typeof offeringUnitOptions)[number];

/**
 * Availability presets. Seasons are deliberately broad because they differ by
 * sport; the association can add a note or choose its own dates ("custom").
 */
export const seasonOptions = ["year_round", "spring", "summer", "autumn", "winter", "custom"] as const;
export type SeasonCode = (typeof seasonOptions)[number];

/** A list of ids from a checkbox group (one or many values); empty values are dropped. */
const idList = (max: number) =>
  z.preprocess(
    (value) => (Array.isArray(value) ? value : value ? [value] : []).filter((v) => v !== ""),
    z.array(z.string().uuid()).max(max),
  );

/** Onboarding step 1: identity, address and contact. */
export const associationIdentitySchema = z.object({
  name: organizationNameSchema,
  cvr: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(/^\d{8}$/, "CVR-nummeret skal være 8 cifre")
      .nullable(),
  ),
  associationKind: optionalText(80),
  addressLine: requiredText(200, "Skriv foreningens adresse"),
  postalCode: z
    .string({ message: "Skriv et postnummer" })
    .trim()
    .regex(/^\d{4}$/, "Postnummeret skal være 4 cifre"),
  city: requiredText(80, "Skriv byen"),
  municipality: optionalText(80),
  region: z.enum(danishRegion.enumValues, { message: "Vælg en region" }),
  contactName: requiredText(120, "Skriv navnet på kontaktpersonen"),
  contactEmail: z.string({ message: "Skriv en e-mail" }).trim().email("Skriv en gyldig e-mail").max(200),
  contactPhone: optionalText(30),
  vatRegistered: z.preprocess(
    (value) => (value === "yes" ? true : value === "no" ? false : null),
    z.boolean().nullable(),
  ),
});
export type AssociationIdentityInput = z.infer<typeof associationIdentitySchema>;

/** Onboarding step 2: profile. */
export const associationProfileSchema = z.object({
  description: requiredText(2000, "Skriv en kort beskrivelse af foreningen"),
  activities: optionalText(1000),
  memberCount: optionalInt("Skriv et helt tal"),
  memberAgeBands: z.array(z.enum(memberAgeBandOptions)).default([]),
  genderMix: z.preprocess(emptyToNull, z.enum(genderMixOptions).nullable()).default(null),
  femaleSharePercent: z
    .preprocess(
      (value) => (emptyToNull(value) === null ? null : Number(value)),
      z
        .number({ message: "Skriv et tal mellem 0 og 100" })
        .int("Skriv et helt tal")
        .min(0, "Skriv et tal mellem 0 og 100")
        .max(100, "Skriv et tal mellem 0 og 100")
        .nullable(),
    )
    .default(null),
  audienceSegments: z.array(z.enum(audienceSegmentOptions)).default([]),
  facilities: optionalText(1000),
});
export type AssociationProfileInput = z.input<typeof associationProfileSchema>;

export const channelSchema = z.object({
  kind: z.enum(channelKind.enumValues, { message: "Vælg en kanaltype" }),
  name: optionalText(120),
  url: optionalUrl,
  audienceCount: optionalInt("Skriv antal som et helt tal"),
  audienceBasis: z.enum(audienceBasis.enumValues).default("stated"),
});
export type ChannelInput = z.infer<typeof channelSchema>;

/** Several channels added in one go (one row per checked kind). */
export const channelBatchSchema = z
  .array(channelSchema)
  .min(1, "Vælg mindst én kanal")
  .max(channelKind.enumValues.length * 3);
export type ChannelBatchInput = z.infer<typeof channelBatchSchema>;

export const locationSchema = z.object({
  kind: z.enum(locationKind.enumValues, { message: "Vælg en type" }),
  name: requiredText(120, "Giv stedet et navn"),
  addressLine: optionalText(200),
  postalCode: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Postnummeret skal være 4 cifre")
      .nullable(),
  ),
  city: optionalText(80),
  description: optionalText(1000),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const exclusionsSchema = z.object({
  industryIds: z.array(z.string().uuid()).max(100).default([]),
  expiresOn: z.record(z.string().uuid(), optionalDate).default({}),
  note: z.record(z.string().uuid(), optionalText(300)).default({}),
});
export type ExclusionsInput = z.infer<typeof exclusionsSchema>;

const offeringCommon = {
  description: requiredText(2000, "Beskriv produktet"),
  priceMinor: priceInKroner,
  capacity: z.preprocess(
    (value) => (emptyToNull(value) === null ? null : Number(value)),
    z
      .number({ message: "Skriv et helt tal" })
      .int("Skriv et helt tal")
      .min(1, "Mindst 1")
      .max(100_000)
      .nullable(),
  ),
  season: z.enum(seasonOptions, { message: "Vælg en periode" }).default("custom"),
  availableFrom: optionalDate,
  availableTo: optionalDate,
  availabilityNote: optionalText(500),
  channelIds: idList(50).default([]),
  locationIds: idList(50).default([]),
  locationNote: optionalText(300),
};

type PeriodFields = { season: SeasonCode; availableFrom: string | null; availableTo: string | null };
const periodCheck = (value: PeriodFields) =>
  !value.availableFrom || !value.availableTo || value.availableFrom <= value.availableTo;
const periodMessage = { message: "Slutdatoen skal ligge efter startdatoen", path: ["availableTo"] };
/** Dates only apply to "custom"; a preset season clears them. */
const normalizePeriod = <T extends PeriodFields>(value: T): T =>
  value.season === "custom" ? value : { ...value, availableFrom: null, availableTo: null };

export const standardOfferingSchema = z
  .object({
    templateId: z.string({ message: "Vælg et standardprodukt" }).uuid("Vælg et standardprodukt"),
    title: requiredText(120, "Giv produktet en titel"),
    ...offeringCommon,
  })
  .refine(periodCheck, periodMessage)
  .transform(normalizePeriod);
export type StandardOfferingInput = z.input<typeof standardOfferingSchema>;

export const customOfferingSchema = z
  .object({
    categoryIds: z.preprocess(
      (value) => (Array.isArray(value) ? value : value ? [value] : []).filter((v) => v !== ""),
      z.array(z.string().uuid()).min(1, "Vælg mindst én kategori").max(6),
    ),
    title: requiredText(120, "Giv produktet en titel"),
    unitCode: z.enum(offeringUnitOptions, { message: "Vælg en enhed" }),
    unit: optionalText(40),
    evidenceRequirements: requiredText(1000, "Skriv hvordan I dokumenterer leverancen"),
    ...offeringCommon,
  })
  .refine(periodCheck, periodMessage)
  .refine((value) => value.unitCode !== "other" || !!value.unit, {
    message: "Skriv hvad én enhed er, f.eks. “opslag”",
    path: ["unit"],
  })
  .transform(normalizePeriod);
export type CustomOfferingInput = z.input<typeof customOfferingSchema>;

export const reviewDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: optionalText(1000),
});
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;

export const offeringReviewSchema = reviewDecisionSchema.extend({
  /** Admin may correct the price when approving (spec: admin sets/approves custom prices). */
  priceMinor: z.preprocess(
    (value) => (emptyToNull(value) === null ? undefined : value),
    priceInKroner.optional(),
  ),
});
export type OfferingReviewInput = z.infer<typeof offeringReviewSchema>;
