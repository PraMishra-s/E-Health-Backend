CREATE TABLE "treatment_medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treatment_id" uuid,
	"medicine_id" uuid,
	"batch_id" uuid,
	"dosage" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "treatment_medicines" ADD CONSTRAINT "treatment_medicines_treatment_id_patient_treatment_history_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."patient_treatment_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_medicines" ADD CONSTRAINT "treatment_medicines_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_medicines" ADD CONSTRAINT "treatment_medicines_batch_id_medicine_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."medicine_batches"("id") ON DELETE set null ON UPDATE no action;