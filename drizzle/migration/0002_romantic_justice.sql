DROP INDEX "idx_accepted_events_budgetId_userId";--> statement-breakpoint
CREATE INDEX "idx_accepted_events_userId_budgetId_" ON "accepted_events" USING btree ("user_id","budget_id");