# Data Model

## Database: Vercel Postgres

Single database with minimal schema. Recipes store the full structured data as JSONB to keep things simple — no need to normalize ingredients and steps into separate tables for a personal app.

## Tables

### `users`

Managed by NextAuth. Stores session/account data.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | From Google profile |
| email | text | Unique |
| image | text | Google avatar URL |
| emailVerified | timestamp | |

Plus NextAuth's `accounts` and `sessions` tables (auto-created by the adapter).

### `recipes`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| user_id | uuid | FK → users.id |
| title | text | Recipe title |
| source_url | text | Original URL |
| source_type | text | `youtube` or `web` |
| servings | integer | Nullable |
| ingredients | jsonb | Array of `{ name, quantity, unit }` |
| prep_steps | jsonb | Array of `{ instruction, ingredients[] }` |
| cooking_steps | jsonb | Array of `{ instruction, ingredients[] }` |
| raw_content | text | Original extracted text (transcript or HTML) — useful for re-parsing later if prompts improve |
| created_at | timestamp | Default `now()` |
| updated_at | timestamp | Default `now()` |

**Indexes:**
- `idx_recipes_user_id` on `user_id`
- `idx_recipes_title_search` — GIN index on `to_tsvector('english', title)` for full-text search

## TypeScript Types

All shared types live in `src/types/recipe.ts`. These are the source of truth — the database JSONB columns, API responses, and LLM output parsing all use these types.

```typescript
// src/types/recipe.ts

export const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "piece", "pinch", "to taste"] as const;
export type Unit = (typeof UNITS)[number];

export const SOURCE_TYPES = ["youtube", "web"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export interface Ingredient {
  name: string;
  quantity: number;
  unit: Unit;
  /** Optional prep notes, e.g. "finely chopped", "room temperature" */
  notes?: string;
}

export interface Step {
  instruction: string;
  /** Ingredients used in this step, with the quantity for this step. Empty array if none (e.g. "Preheat oven"). */
  ingredients: Ingredient[];
}

export interface Recipe {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: SourceType;
  servings: number | null;
  ingredients: Ingredient[];
  prepSteps: Step[];
  cookingSteps: Step[];
  createdAt: string;
  updatedAt: string;
}

/** What the LLM returns (no id, no timestamps) */
export interface ParsedRecipe {
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  prepSteps: Step[];
  cookingSteps: Step[];
}

/** Recipe list item (no full steps/ingredients) */
export interface RecipeSummary {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: SourceType;
  createdAt: string;
}

// --- API request/response types ---

export interface ParseRequest {
  url: string;
}

export interface ParseResponse {
  recipe: Recipe;
}

export interface SuggestRequest {
  message: string;
}

export interface SuggestResponse {
  reply: string;
  sources: Array<{ title: string; url: string }>;
}

export interface RecipeListResponse {
  recipes: RecipeSummary[];
}
```

## JSONB Structures

The JSONB columns store arrays of `Ingredient` and `Step` as defined above.

Example ingredient:
```json
{ "name": "chicken breast", "quantity": 500, "unit": "g", "notes": "boneless, skinless" }
```

Example step:
```json
{
  "instruction": "Dice the onion into small cubes",
  "ingredients": [{ "name": "onion", "quantity": 1, "unit": "piece" }]
}
```

- A step can reference zero ingredients (e.g., "Preheat oven to 200°C")

## ORM / Query Layer

Use **Drizzle ORM** — lightweight, type-safe, works well with Vercel Postgres and Next.js. Define the schema in TypeScript, generate migrations.

```typescript
// Example schema definition (src/db/schema.ts)
import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type").notNull(), // 'youtube' | 'web'
  servings: integer("servings"),
  ingredients: jsonb("ingredients").notNull(), // Ingredient[]
  prepSteps: jsonb("prep_steps").notNull(),   // Step[]
  cookingSteps: jsonb("cooking_steps").notNull(), // Step[]
  rawContent: text("raw_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Migration Strategy

Drizzle Kit generates SQL migrations from schema changes:

```bash
npx drizzle-kit generate  # Generate migration from schema diff
npx drizzle-kit push      # Apply directly (dev) or run migrations (prod)
```
