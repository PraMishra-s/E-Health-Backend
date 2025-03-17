CREATE TYPE "public"."severity" AS ENUM('MILD', 'MODERATE', 'SEVERE');--> statement-breakpoint
CREATE TABLE "patient_treatment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid,
	"doctor_id" uuid,
	"illness_id" uuid,
	"severity" "severity" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "patient_treatment_history" ADD CONSTRAINT "patient_treatment_history_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_history" ADD CONSTRAINT "patient_treatment_history_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_history" ADD CONSTRAINT "patient_treatment_history_illness_id_illnesses_id_fk" FOREIGN KEY ("illness_id") REFERENCES "public"."illnesses"("id") ON DELETE set null ON UPDATE no action;