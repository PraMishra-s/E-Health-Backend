CREATE TYPE "public"."relation" AS ENUM('CHILD', 'SPOUSE', 'PARENT', 'SIBLING', 'OTHER');--> statement-breakpoint
CREATE TABLE "staff_family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"name" text NOT NULL,
	"gender" "gender",
	"contact_number" varchar(10),
	"relation" "relation" NOT NULL,
	"date_of_birth" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_family_members_contact_number_unique" UNIQUE("contact_number")
);
--> statement-breakpoint
ALTER TABLE "staff_family_members" ADD CONSTRAINT "staff_family_members_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;