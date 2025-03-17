CREATE TYPE "public"."illness_type" AS ENUM('COMMUNICABLE', 'NON_COMMUNICABLE');--> statement-breakpoint
CREATE TABLE "illnesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "illness_type" NOT NULL,
	"description" text DEFAULT ''
);
