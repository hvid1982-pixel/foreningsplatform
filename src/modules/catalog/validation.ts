import { z } from "zod";
import { optionalText, priceInKroner } from "@/lib/validation";

export const productTemplateSchema = z
  .object({
    categoryId: z.string({ message: "Vælg en kategori" }).uuid("Vælg en kategori"),
    name: z.string().trim().min(2, "Skriv et navn").max(120),
    description: z.string().trim().min(1, "Skriv en beskrivelse").max(2000),
    unit: z.string().trim().min(1, "Skriv en enhed").max(40),
    minimumDeliverables: z.string().trim().min(1, "Skriv minimumsleverancen").max(1000),
    evidenceRequirements: z.string().trim().min(1, "Skriv dokumentationskravet").max(1000),
    priceMinMinor: priceInKroner,
    suggestedPriceMinor: priceInKroner,
    priceMaxMinor: priceInKroner,
    note: optionalText(500),
  })
  .refine((v) => v.priceMinMinor <= v.suggestedPriceMinor && v.suggestedPriceMinor <= v.priceMaxMinor, {
    message: "Prisen skal opfylde: minimum ≤ vejledende ≤ maksimum",
    path: ["suggestedPriceMinor"],
  });
export type ProductTemplateInput = z.input<typeof productTemplateSchema>;
