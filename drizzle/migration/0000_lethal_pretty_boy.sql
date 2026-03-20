CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"details" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
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
	"budget_id" uuid NOT NULL,
	"server_created_at" bigint NOT NULL,
	"offline_last_modified" bigint NOT NULL,
	"version" integer NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sequences" (
	"budget_id" uuid PRIMARY KEY NOT NULL,
	"sequence_no" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accepted_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sequence_no" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"budget_id" uuid NOT NULL,
	"type" text NOT NULL,
	"user_id" text NOT NULL,
	"record_id" text NOT NULL,
	"when" bigint NOT NULL,
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
	"joined_at" bigint NOT NULL,
	CONSTRAINT "pk_participants" PRIMARY KEY("user_id","budget_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"photo" text,
	"photo_key" text,
	"last_modified" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_budgetId" ON "categories" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "idx_accepted_events_userId_budgetId_" ON "accepted_events" USING btree ("user_id","budget_id");--> statement-breakpoint
CREATE INDEX "idx_expenses_budgetId" ON "expenses" USING btree ("budget_id");