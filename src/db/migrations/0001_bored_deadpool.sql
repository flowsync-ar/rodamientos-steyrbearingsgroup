ALTER TABLE "quotes" ADD COLUMN "quote_number" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number");