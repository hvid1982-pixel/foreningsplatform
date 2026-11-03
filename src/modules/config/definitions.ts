/**
 * Registry of configurable business rules.
 *
 * Every rule that the specification calls a "configurable default" lives here
 * with a schema, a default and a Danish label. Code reads rules through
 * `getConfigValue(key)`, never by hard-coding the number.
 *
 * Adding a rule: add an entry below, add a test if it has logic, document it in
 * DECISIONS.md. Changing a default here does NOT change values already saved in
 * the database: saved versions win.
 */
import { z } from "zod";

type Definition<T> = {
  label: string;
  description: string;
  schema: z.ZodType<T>;
  defaultValue: T;
  /** Where the default comes from, shown in admin. */
  source: string;
};

function define<T>(definition: Definition<T>): Definition<T> {
  return definition;
}

export const configDefinitions = {
  "campaigns.association_response_window_hours": define({
    label: "Svarfrist for foreninger (timer)",
    description: "Hvor længe en forening har til at svare på en kampagneinvitation.",
    schema: z
      .number()
      .int()
      .min(1)
      .max(24 * 30),
    defaultValue: 72,
    source: "Spec afsnit 7 og 17 (forslag, ikke endelig politik)",
  }),
  "catalog.custom_offering_requires_approval": define({
    label: "Egne produkter kræver admin-godkendelse",
    description: "Om foreningers egne produkter skal godkendes før publicering.",
    schema: z.boolean(),
    defaultValue: true,
    source: "Spec afsnit 4 og 17 (forslag)",
  }),
  "finance.payout_requires_company_payment": define({
    label: "Udbetaling først efter virksomhedens betaling",
    description: "Foreninger får først udbetalt, når virksomheden har betalt.",
    schema: z.boolean(),
    defaultValue: true,
    source: "Spec afsnit 9 og 17 (forslag til pilot)",
  }),
  "finance.platform_fee_basis_points": define({
    label: "Platformgebyr (basispoint, 100 = 1 %)",
    description: "Åben beslutning. Ingen værdi betyder, at gebyret ikke er fastlagt.",
    schema: z.number().int().min(0).max(10_000).nullable(),
    defaultValue: null,
    source: "Spec afsnit 9 (åben beslutning; 15 % var kun illustrativt)",
  }),
  "onboarding.booking_url": define({
    label: "Link til booking af onboardinghjælp",
    description: "Ekstern bookingside (f.eks. Calendly eller Microsoft Bookings).",
    schema: z.string().url().nullable(),
    defaultValue: null,
    source: "Spec afsnit 3",
  }),
} as const;

export type ConfigKey = keyof typeof configDefinitions;
export type ConfigValue<K extends ConfigKey> = z.infer<(typeof configDefinitions)[K]["schema"]>;

export const configKeys = Object.keys(configDefinitions) as ConfigKey[];

export function isConfigKey(key: string): key is ConfigKey {
  return key in configDefinitions;
}
