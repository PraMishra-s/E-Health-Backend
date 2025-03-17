ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_medicine_id_medicines_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;