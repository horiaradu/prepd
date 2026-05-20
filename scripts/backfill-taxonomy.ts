/**
 * One-shot classifier that fills meal_type / cuisine / cook_style / total_time_minutes
 * for any recipes still missing them.
 *
 * Usage:
 *   DATABASE_URL=... GEMINI_API_KEY=... npx tsx scripts/backfill-taxonomy.ts [--dry-run] [--limit N]
 */

import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, isNull, or, sql } from "drizzle-orm";
import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import {
  COOK_STYLES,
  MEAL_TYPES,
  type CookStyle,
  type MealType,
} from "@/types/recipe";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const limit =
  limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : null;

const SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    mealType: { type: Type.STRING, enum: [...MEAL_TYPES] },
    cuisine: { type: Type.STRING, nullable: true },
    cookStyle: { type: Type.STRING, enum: [...COOK_STYLES] },
    totalTimeMinutes: { type: Type.NUMBER, nullable: true },
  },
  required: ["mealType", "cookStyle"],
};

const SYSTEM_INSTRUCTION = `You classify recipes. Given a recipe's title, ingredients, and steps, return:
- mealType: one of breakfast | main | side | soup | salad | dessert | snack | drink | sauce | bread | other. Use "main" for dinner/lunch entrées. Use "other" only if nothing else fits.
- cuisine: short lower-case slug like "italian", "french", "japanese", "mexican", "middle-eastern", "romanian", "american", "fusion". Null if genuinely unclassifiable.
- cookStyle: one of no-cook | stovetop | oven | grill | slow-cooker | mixed. "mixed" when both stovetop and oven are essential.
- totalTimeMinutes: integer minutes total active + passive time (including resting, marinating, rising). Null only if completely indeterminable.

Return ONLY the JSON object — no markdown, no commentary.`;

interface Classification {
  mealType: MealType;
  cuisine: string | null;
  cookStyle: CookStyle;
  totalTimeMinutes: number | null;
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

function normalizeCuisine(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug.length > 0 ? slug : null;
}

async function classify(
  ai: GoogleGenAI,
  recipe: {
    title: string;
    ingredients: unknown;
    prepSteps: unknown;
    cookingSteps: unknown;
  },
): Promise<Classification> {
  const payload = JSON.stringify(
    {
      title: recipe.title,
      ingredients: recipe.ingredients,
      prepSteps: recipe.prepSteps,
      cookingSteps: recipe.cookingSteps,
    },
    null,
    2,
  );

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Classify this recipe:\n\n${payload}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
    },
  });

  const parsed = JSON.parse(response.text!);
  const mealType = (MEAL_TYPES as readonly string[]).includes(parsed.mealType)
    ? (parsed.mealType as MealType)
    : "other";
  const cookStyle = (COOK_STYLES as readonly string[]).includes(
    parsed.cookStyle,
  )
    ? (parsed.cookStyle as CookStyle)
    : "mixed";
  const totalTimeMinutes =
    typeof parsed.totalTimeMinutes === "number" &&
    Number.isFinite(parsed.totalTimeMinutes) &&
    parsed.totalTimeMinutes > 0
      ? Math.round(parsed.totalTimeMinutes)
      : null;
  return {
    mealType,
    cuisine: normalizeCuisine(parsed.cuisine),
    cookStyle,
    totalTimeMinutes,
  };
}

async function main() {
  const ai = getClient();

  const baseQuery = db
    .select({
      id: recipes.id,
      title: recipes.title,
      ingredients: recipes.ingredients,
      prepSteps: recipes.prepSteps,
      cookingSteps: recipes.cookingSteps,
    })
    .from(recipes)
    .where(
      or(
        isNull(recipes.mealType),
        isNull(recipes.cookStyle),
        sql`${recipes.totalTimeMinutes} IS NULL`,
      ),
    );

  const rows = limit ? await baseQuery.limit(limit) : await baseQuery;

  console.log(
    `Found ${rows.length} recipe(s) to classify${dryRun ? " (dry run)" : ""}`,
  );

  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const c = await classify(ai, row);
      console.log(
        `  ${row.id}  ${row.title.slice(0, 60).padEnd(60)}  meal=${c.mealType.padEnd(9)} cuisine=${(c.cuisine ?? "—").padEnd(14)} style=${c.cookStyle.padEnd(12)} time=${c.totalTimeMinutes ?? "—"}`,
      );
      if (!dryRun) {
        await db
          .update(recipes)
          .set({
            mealType: c.mealType,
            cuisine: c.cuisine,
            cookStyle: c.cookStyle,
            totalTimeMinutes: c.totalTimeMinutes,
          })
          .where(eq(recipes.id, row.id));
      }
      ok++;
    } catch (err) {
      failed++;
      console.error(
        `  ${row.id}  FAILED: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\nDone. ${ok} classified, ${failed} failed.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
