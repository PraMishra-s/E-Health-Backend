ALTER TYPE "public"."blood_type" ADD VALUE 'Unknown';--> statement-breakpoint
ALTER TABLE "patient_treatment_history" ADD COLUMN "blood_pressure" text;--> statement-breakpoint
ALTER TABLE "patient_treatment_history" ADD COLUMN "forward_to_hospital" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "patient_treatment_history" ADD COLUMN "forwarded_by_hospital" boolean DEFAULT false;