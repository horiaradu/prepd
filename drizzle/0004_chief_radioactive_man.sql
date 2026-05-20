ALTER TABLE "recipes" ADD COLUMN "meal_type" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "cuisine" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "cook_style" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "total_time_minutes" integer;--> statement-breakpoint
CREATE INDEX "idx_recipes_meal_type" ON "recipes" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "idx_recipes_cuisine" ON "recipes" USING btree ("cuisine");--> statement-breakpoint
CREATE INDEX "idx_recipes_cook_style" ON "recipes" USING btree ("cook_style");