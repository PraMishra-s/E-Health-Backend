CREATE TABLE "mental_health_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treatment_id" uuid,
	"user_id" uuid,
	"family_member_id" uuid,
	"illness_id" uuid,
	"action_taken" text,
	"is_resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mental_health_cases" ADD CONSTRAINT "mental_health_cases_treatment_id_patient_treatment_history_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."patient_treatment_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_cases" ADD CONSTRAINT "mental_health_cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_cases" ADD CONSTRAINT "mental_health_cases_family_member_id_staff_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."staff_family_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mental_health_cases" ADD CONSTRAINT "mental_health_cases_illness_id_illnesses_id_fk" FOREIGN KEY ("illness_id") REFERENCES "public"."illnesses"("id") ON DELETE set null ON UPDATE no action;