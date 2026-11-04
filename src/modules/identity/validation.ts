import { z } from "zod";

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Navnet skal være mindst 2 tegn")
  .max(120, "Navnet må højst være 120 tegn");

export const createOrganizationSchema = z.object({
  type: z.enum(["association", "company"], { message: "Vælg forening eller virksomhed" }),
  name: organizationNameSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const setOrganizationStatusSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(["draft", "pending_review", "active", "suspended", "archived"]),
  reason: z.string().trim().max(500).optional(),
});
