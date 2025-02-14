CREATE TYPE "public"."blood_type" AS ENUM('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'STAFF', 'DEAN', 'HA');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('STUDENT', 'STAFF', 'DEAN', 'NON-STAFF', 'HA');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(8),
	"name" varchar NOT NULL,
	"gender" "gender",
	"department_id" varchar(10),
	"std_year" varchar,
	"user_type" "user_type",
	"blood_type" "blood_type",
	"contact_number" varchar(10) NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "users_contact_number_unique" UNIQUE("contact_number")
);
