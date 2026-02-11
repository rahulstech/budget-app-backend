CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"details" text,
	"server_created_at" bigint NOT NULL,
	"offline_last_modified" bigint NOT NULL,
	"version" integer NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"allocate" numeric(12, 2) NOT NULL,
	"budget_id" text NOT NULL,
	"server_created_at" bigint NOT NULL,
	"offline_last_modified" bigint NOT NULL,
	"version" integer NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accepted_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sequence_no" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"budget_id" uuid NOT NULL,
	"type" text NOT NULL,
	"when" bigint NOT NULL,
	"user_id" text NOT NULL,
	"record_id" text NOT NULL,
	"data" json
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"budget_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"note" text,
	"server_created_at" bigint NOT NULL,
	"offline_last_modified" bigint NOT NULL,
	"version" integer NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"budget_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "pk_participants" PRIMARY KEY("budget_id","user_id")
);
--> statement-breakpoint
CREATE INDEX "idx_categories_budgetId" ON "categories" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "idx_accepted_events_budgetId_userId" ON "accepted_events" USING btree ("budget_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_expenses_budgetId" ON "expenses" USING btree ("budget_id");