CREATE TABLE "ha_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ha_id" uuid,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ha_availability" ADD CONSTRAINT "ha_availability_ha_id_ha_details_ha_id_fk" FOREIGN KEY ("ha_id") REFERENCES "public"."ha_details"("ha_id") ON DELETE cascade ON UPDATE no action;