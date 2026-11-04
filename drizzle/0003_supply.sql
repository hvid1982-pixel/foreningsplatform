CREATE TYPE "public"."audience_basis" AS ENUM('stated', 'measured');--> statement-breakpoint
CREATE TYPE "public"."channel_kind" AS ENUM('website', 'facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'newsletter', 'other');--> statement-breakpoint
CREATE TYPE "public"."danish_region" AS ENUM('hovedstaden', 'sjaelland', 'syddanmark', 'midtjylland', 'nordjylland');--> statement-breakpoint
CREATE TYPE "public"."location_kind" AS ENUM('clubhouse', 'field', 'hall', 'event_venue', 'other');--> statement-breakpoint
CREATE TYPE "public"."offering_kind" AS ENUM('standard', 'custom');--> statement-breakpoint
CREATE TYPE "public"."offering_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TABLE "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"minimum_deliverables" text NOT NULL,
	"evidence_requirements" text NOT NULL,
	"price_min_minor" integer NOT NULL,
	"price_max_minor" integer NOT NULL,
	"suggested_price_minor" integer NOT NULL,
	"currency" text DEFAULT 'DKK' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_templates_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_templates_price_range_check" CHECK ("product_templates"."price_min_minor" >= 0 AND "product_templates"."price_min_minor" <= "product_templates"."suggested_price_minor" AND "product_templates"."suggested_price_minor" <= "product_templates"."price_max_minor")
);
--> statement-breakpoint
CREATE TABLE "association_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "channel_kind" NOT NULL,
	"name" text,
	"url" text,
	"audience_count" integer,
	"audience_basis" "audience_basis" DEFAULT 'stated' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "association_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "location_kind" NOT NULL,
	"name" text NOT NULL,
	"address_line" text,
	"postal_code" text,
	"city" text,
	"description" text,
	"latitude" double precision,
	"longitude" double precision,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "association_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "offering_kind" NOT NULL,
	"template_id" uuid,
	"category_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" text DEFAULT 'DKK' NOT NULL,
	"capacity" integer,
	"available_from" date,
	"available_to" date,
	"availability_note" text,
	"evidence_requirements" text,
	"channel_id" uuid,
	"location_id" uuid,
	"status" "offering_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "association_offerings_price_check" CHECK ("association_offerings"."price_minor" >= 0),
	CONSTRAINT "association_offerings_capacity_check" CHECK ("association_offerings"."capacity" IS NULL OR "association_offerings"."capacity" > 0),
	CONSTRAINT "association_offerings_standard_has_template_check" CHECK ("association_offerings"."kind" <> 'standard' OR "association_offerings"."template_id" IS NOT NULL),
	CONSTRAINT "association_offerings_period_check" CHECK ("association_offerings"."available_from" IS NULL OR "association_offerings"."available_to" IS NULL OR "association_offerings"."available_from" <= "association_offerings"."available_to")
);
--> statement-breakpoint
CREATE TABLE "associations" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"cvr" text,
	"association_kind" text,
	"address_line" text,
	"postal_code" text,
	"city" text,
	"municipality" text,
	"region" "danish_region",
	"latitude" double precision,
	"longitude" double precision,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"description" text,
	"activities" text,
	"member_count" integer,
	"member_age_bands" text[] DEFAULT '{}'::text[] NOT NULL,
	"facilities" text,
	"vat_registered" boolean,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"industry_id" uuid NOT NULL,
	"note" text,
	"expires_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_category_id_catalog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_channels" ADD CONSTRAINT "association_channels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_locations" ADD CONSTRAINT "association_locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD CONSTRAINT "association_offerings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD CONSTRAINT "association_offerings_template_id_product_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."product_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD CONSTRAINT "association_offerings_category_id_catalog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD CONSTRAINT "association_offerings_channel_id_association_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."association_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD CONSTRAINT "association_offerings_location_id_association_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."association_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "association_offerings" ADD CONSTRAINT "association_offerings_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "associations" ADD CONSTRAINT "associations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_exclusions" ADD CONSTRAINT "industry_exclusions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_exclusions" ADD CONSTRAINT "industry_exclusions_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_templates_category_idx" ON "product_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "association_channels_org_idx" ON "association_channels" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "association_locations_org_idx" ON "association_locations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "association_offerings_org_idx" ON "association_offerings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "association_offerings_status_idx" ON "association_offerings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "industry_exclusions_org_industry_idx" ON "industry_exclusions" USING btree ("organization_id","industry_id");--> statement-breakpoint
ALTER TABLE "industries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "associations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "association_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "association_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "industry_exclusions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "association_offerings" ENABLE ROW LEVEL SECURITY;
