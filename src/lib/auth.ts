/**
 * Authentication (Better Auth).
 *
 * Better Auth owns sign-up, sign-in, sessions, e-mail verification and password
 * reset. It stores everything in our own Postgres (tables in
 * src/modules/identity/schema.ts). Authorization — who may see or change what —
 * is NOT handled here; see src/modules/<module>/policies.ts.
 *
 * HTTP endpoints are mounted at /api/auth/* (src/app/api/auth/[...all]/route.ts).
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail, verificationEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { accounts, rateLimits, sessions, users, verifications } from "@/modules/identity/schema";

/** Hosts allowed to serve the app. Vercel preview URLs are allowed via wildcard. */
function allowedHosts(): string[] {
  const hosts = new Set<string>(["localhost:3000", "127.0.0.1:3000"]);
  if (env.BETTER_AUTH_URL) hosts.add(new URL(env.BETTER_AUTH_URL).host);
  for (const value of [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (value) hosts.add(value);
  }
  return [...hosts];
}

function fallbackBaseUrl(): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const isDeployed = env.APP_ENV === "staging" || env.APP_ENV === "production";

export const auth = betterAuth({
  appName: "Foreningsplatform",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: { allowedHosts: allowedHosts(), fallback: fallbackBaseUrl() },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      rateLimit: rateLimits,
    },
  }),
  advanced: {
    // Let Postgres generate UUIDs (gen_random_uuid()) for all auth tables.
    database: { generateId: "uuid" },
    useSecureCookies: isDeployed,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(resetPasswordEmail(user.email, user.name, url));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(verificationEmail(user.email, user.name, url));
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  rateLimit: {
    // On by default in deployed environments; storage in Postgres so limits
    // hold across serverless instances.
    enabled: isDeployed,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  telemetry: { enabled: false },
  // nextCookies must be the last plugin: it lets server actions set cookies.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
