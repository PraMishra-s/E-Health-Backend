CREATE TABLE "treatment_illnesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treatment_id" uuid,
	"illness_id" uuid
);
--> statement-breakpoint
ALTER TABLE "patient_treatment_history" DROP CONSTRAINT "patient_treatment_history_illness_id_illnesses_id_fk";
--> statement-breakpoint
ALTER TABLE "treatment_illnesses" ADD CONSTRAINT "treatment_illnesses_treatment_id_patient_treatment_history_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."patient_treatment_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_illnesses" ADD CONSTRAINT "treatment_illnesses_illness_id_illnesses_id_fk" FOREIGN KEY ("illness_id") REFERENCES "public"."illnesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_history" DROP COLUMN "illness_id";