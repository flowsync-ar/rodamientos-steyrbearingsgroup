CREATE TYPE "public"."payment_method" AS ENUM('transferencia', 'efectivo', 'cheque', 'tarjeta');--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "paid_at" timestamp with time zone;