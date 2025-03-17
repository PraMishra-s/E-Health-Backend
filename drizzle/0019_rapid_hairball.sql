ALTER TABLE "inventory_transactions" ADD COLUMN "batch_name" text;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "medicine_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE set null ON UPDATE no action;