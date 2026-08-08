ALTER TABLE "recipes" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "parse_error" text;