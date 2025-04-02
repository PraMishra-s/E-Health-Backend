ALTER TABLE "public"."users" ALTER COLUMN "user_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."user_type";--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('STUDENT', 'STAFF', 'DEAN', 'NON-STAFF', 'HA', 'MAIN_HA');--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "user_type" SET DATA TYPE "public"."user_type" USING "user_type"::"public"."user_type";