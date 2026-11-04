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
  facilities: optionalText(1000),
});
export type AssociationProfileInput = z.infer<typeof associationProfileSchema>;

export const channelSchema = z.object({
  kind: z.enum(channelKind.enumValues, { message: "Vælg en kanaltype" }),
  name: optionalText(120),
  url: optionalUrl,
  audienceCount: optionalInt("Skriv antal som et helt tal"),
  audienceBasis: z.enum(audienceBasis.enumValues).default("stated"),
});
export type ChannelInput = z.infer<typeof channelSchema>;

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
  availableFrom: optionalDate,
  availableTo: optionalDate,
  availabilityNote: optionalText(500),
  channelId: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  locationId: z.preprocess(emptyToNull, z.string().uuid().nullable()),
};

const periodCheck = (value: { availableFrom: string | null; availableTo: string | null }) =>
  !value.availableFrom || !value.availableTo || value.availableFrom <= value.availableTo;
const periodMessage = { message: "Slutdatoen skal ligge efter startdatoen", path: ["availableTo"] };

export const standardOfferingSchema = z
  .object({
    templateId: z.string({ message: "Vælg et standardprodukt" }).uuid("Vælg et standardprodukt"),
    title: requiredText(120, "Giv produktet en titel"),
    ...offeringCommon,
  })
  .refine(periodCheck, periodMessage);
export type StandardOfferingInput = z.infer<typeof standardOfferingSchema>;

export const customOfferingSchema = z
  .object({
    categoryId: z.string({ message: "Vælg en kategori" }).uuid("Vælg en kategori"),
    title: requiredText(120, "Giv produktet en titel"),
    unit: requiredText(40, "Skriv hvad én enhed er, f.eks. “opslag”"),
    evidenceRequirements: requiredText(1000, "Skriv hvordan I dokumenterer leverancen"),
    ...offeringCommon,
  })
  .refine(periodCheck, periodMessage);
export type CustomOfferingInput = z.infer<typeof customOfferingSchema>;

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
