CREATE TABLE "login" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "role",
	"verified" boolean DEFAULT false,
	CONSTRAINT "login_id_unique" UNIQUE("id"),
	CONSTRAINT "login_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "login" ADD CONSTRAINT "login_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;