CREATE TYPE "public"."ha_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
ALTER TABLE "ha_details" ADD COLUMN "status" "ha_status" DEFAULT 'INACTIVE';