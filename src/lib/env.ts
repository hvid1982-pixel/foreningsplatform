import { z } from "zod";

/**
 * Server-side environment configuration, validated once at startup.
 *
 * Every variable is documented in `.env.example`. Never import this module from
 * client components: it may contain secrets.
 */
const envSchema = z.object({
  /** Which deployment this is. Controls safety checks such as seeding. */
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET skal være mindst 32 tegn"),
  /** Public base URL. Optional on Vercel, where it is derived from VERCEL_* variables. */
  BETTER_AUTH_URL: z.string().url().optional(),
  EMAIL_TRANSPORT: z.enum(["smtp", "log"]).default("log"),
  EMAIL_FROM: z.string().default("Foreningsplatform <no-reply@localhost>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  VERCEL_URL: z.string().optional(),
  VERCEL_BRANCH_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Ugyldig miljøkonfiguration:\n${issues.join("\n")}\nSe .env.example.`);
  }
  if (parsed.data.EMAIL_TRANSPORT === "smtp" && !parsed.data.SMTP_HOST) {
    throw new Error("EMAIL_TRANSPORT=smtp kræver SMTP_HOST. Se .env.example.");
  }
  return parsed.data;
}

export const env = loadEnv();
