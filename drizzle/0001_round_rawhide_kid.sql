CREATE TABLE "cook_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"tweaks" text,
	"cooked_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipe_snapshot" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "original_recipe" jsonb;--> statement-breakpoint
ALTER TABLE "cook_log" ADD CONSTRAINT "cook_log_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cook_log" ADD CONSTRAINT "cook_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_messages" ADD CONSTRAINT "recipe_messages_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_shares" ADD CONSTRAINT "recipe_shares_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cook_log_recipe_id" ON "cook_log" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_cook_log_user_id" ON "cook_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_messages_recipe_id" ON "recipe_messages" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_shares_recipient" ON "recipe_shares" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_recipe_shares_sender" ON "recipe_shares" USING btree ("sender_user_id");