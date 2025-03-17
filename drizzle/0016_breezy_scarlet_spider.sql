ALTER TABLE "inventory_transactions" RENAME COLUMN "medicine_id" TO "batch_id";--> statement-breakpoint
ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_medicine_id_medicines_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_batch_id_medicine_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."medicine_batches"("id") ON DELETE cascade ON UPDATE no action;