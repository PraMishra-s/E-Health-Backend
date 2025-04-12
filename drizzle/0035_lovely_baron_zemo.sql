CREATE TABLE "illness_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	CONSTRAINT "illness_categories_name_unique" UNIQUE("name")
);
