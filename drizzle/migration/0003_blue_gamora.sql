ALTER TABLE "users" ADD COLUMN "photo" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "thumbnail_url";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "original_url";