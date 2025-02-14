CREATE TABLE "programmes" (
	"programme_id" varchar(10) PRIMARY KEY NOT NULL,
	"programme_name" varchar(255) NOT NULL,
	CONSTRAINT "programmes_programme_id_unique" UNIQUE("programme_id"),
	CONSTRAINT "programmes_programme_name_unique" UNIQUE("programme_name")
);
