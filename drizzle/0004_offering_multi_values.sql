ALTER TABLE "association_offerings" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD COLUMN "category_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD COLUMN "unit_code" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD COLUMN "season" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD COLUMN "channel_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD COLUMN "location_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD COLUMN "location_note" text;--> statement-breakpoint
ALTER TABLE "associations" ADD COLUMN "gender_mix" text;--> statement-breakpoint
ALTER TABLE "associations" ADD COLUMN "female_share_percent" integer;--> statement-breakpoint
ALTER TABLE "associations" ADD COLUMN "audience_segments" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
CREATE INDEX "association_offerings_categories_idx" ON "association_offerings" USING gin ("category_ids");--> statement-breakpoint
-- Backfill (hand-written): copy the single-value columns into the new arrays.
-- The old columns stay until the follow-up contract migration (ADR-016).
UPDATE "association_offerings" SET "category_ids" = ARRAY["category_id"] WHERE "category_id" IS NOT NULL AND cardinality("category_ids") = 0;--> statement-breakpoint
UPDATE "association_offerings" SET "channel_ids" = ARRAY["channel_id"] WHERE "channel_id" IS NOT NULL AND cardinality("channel_ids") = 0;--> statement-breakpoint
UPDATE "association_offerings" SET "location_ids" = ARRAY["location_id"] WHERE "location_id" IS NOT NULL AND cardinality("location_ids") = 0;
