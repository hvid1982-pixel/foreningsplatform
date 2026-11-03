-- Defence in depth for hosted Postgres (e.g. Supabase), where the public schema
-- may be exposed through an auto-generated REST API to the `anon` and
-- `authenticated` roles. Enabling row-level security WITHOUT any policies
-- denies those roles all access. The application connects as the table owner,
-- which bypasses RLS, so app behaviour is unchanged. Authorization itself is
-- enforced in the application (ADR-003).
-- Every new table must also enable RLS; tests/integration/migrations.test.ts checks this.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "configuration_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "catalog_categories" ENABLE ROW LEVEL SECURITY;
