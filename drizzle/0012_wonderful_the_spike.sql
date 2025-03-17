CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_category_id_medicine_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."medicine_categories"("id") ON DELETE set null ON UPDATE no action;