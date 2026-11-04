/**
 * Shared Zod helpers for form input. Form values arrive as strings; empty
 * strings become null. Helpers also accept already-typed values, so services
 * can be called directly (e.g. from tests and scripts).
 */
import { z } from "zod";
import { parseKronerToMinor } from "@/lib/money";

export const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value === undefined ? null : value;

export const optionalText = (max: number, message = `Højst ${max} tegn`) =>
  z.preprocess(emptyToNull, z.string().trim().max(max, message).nullable());

export const requiredText = (max: number, message: string) =>
  z.string({ message }).trim().min(1, message).max(max, `Højst ${max} tegn`);

export const optionalInt = (message: string) =>
  z.preprocess((value) => {
    const v = emptyToNull(value);
    if (typeof v === "string") return Number(v.replace(/\./g, ""));
    return v;
  }, z.number({ message }).int(message).min(0, message).max(100_000_000, message).nullable());

export const optionalUrl = z.preprocess((value) => {
  const v = emptyToNull(value);
  if (typeof v === "string" && !/^https?:\/\//i.test(v)) return `https://${v.trim()}`;
  return v;
}, z.string().trim().url("Skriv en gyldig webadresse").max(500).nullable());

export const optionalDate = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vælg en dato")
    .nullable(),
);

/** Kroner as typed by a user ("1.500,50"), converted to integer øre. */
export const priceInKroner = z.union([
  z.number().int().min(0).max(100_000_000_00),
  z.string({ message: "Skriv en pris" }).transform((value, ctx) => {
    const minor = parseKronerToMinor(value);
    if (minor === null) {
      ctx.addIssue({ code: "custom", message: "Skriv prisen i kroner, f.eks. 1500 eller 1.500,50" });
      return z.NEVER;
    }
    return minor;
  }),
]);
