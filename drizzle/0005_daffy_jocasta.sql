CREATE TABLE "ha_details" (
	"ha_id" uuid PRIMARY KEY NOT NULL,
	"secret_key" text NOT NULL,
	"is_available" boolean DEFAULT true,
	"is_on_leave" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ha_details" ADD CONSTRAINT "ha_details_ha_id_users_id_fk" FOREIGN KEY ("ha_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;