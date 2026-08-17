CREATE TABLE "industry_margins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry" text NOT NULL,
	"margin_percent" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industry_margins_industry_unique" UNIQUE("industry")
);
--> statement-breakpoint
DROP TABLE "price_list_rules";--> statement-breakpoint
DROP TABLE "price_lists";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "price_list_id";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "default_price_list_id";
