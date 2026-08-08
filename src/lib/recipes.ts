import { db } from "@/db";
import { recipes, cookLog, recipeMessages } from "@/db/schema";
import { and, eq, desc, asc, count, inArray, max, sql } from "drizzle-orm";
import type {
  Recipe,
  RecipeStatus,
  RecipeSummary,
  SourceType,
  ParsedRecipe,
  Cuisine,
  MealType,
  CookStyle,
} from "@/types/recipe";
import type { Operation } from "@/lib/recipe-operations";

// A row still "parsing" this long after its last update was interrupted
// (crash, deploy) — the background parse is bounded by the route's
// maxDuration (300s), so anything older is dead. Detected lazily on read;
// no cron needed.
const STALE_PARSE_MS = 360_000;

function isStaleParse(status: string, updatedAt: Date | string): boolean {
  if (status !== "parsing") return false;
  const updated =
    updatedAt instanceof Date ? updatedAt : new Date(String(updatedAt));
  return Date.now() - updated.getTime() > STALE_PARSE_MS;
}

// Marks interrupted parses as failed — or ready when the row already has
// content (an interrupted reparse). Returns the resolved status per id.
async function failStaleParses(
  ids: string[],
): Promise<Map<string, RecipeStatus>> {
  if (ids.length === 0) return new Map();

  const rows = await db
    .select({
      id: recipes.id,
      hasContent: sql<boolean>`jsonb_array_length(${recipes.ingredients}) > 0`,
    })
    .from(recipes)
    .where(inArray(recipes.id, ids));

  const readyIds = rows.filter((r) => r.hasContent).map((r) => r.id);
  const failedIds = rows.filter((r) => !r.hasContent).map((r) => r.id);
  const now = new Date();

  for (const [status, group] of [
    ["ready", readyIds],
    ["failed", failedIds],
  ] as const) {
    if (group.length === 0) continue;
    await db
      .update(recipes)
      .set({ status, parseError: "parse-interrupted", updatedAt: now })
      .where(
        and(inArray(recipes.id, group), eq(recipes.status, "parsing")),
      );
  }

  return new Map([
    ...readyIds.map((id) => [id, "ready"] as const),
    ...failedIds.map((id) => [id, "failed"] as const),
  ]);
}

export async function getRecipe(
  id: string,
  userId: string,
): Promise<Recipe | null> {
  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

  if (!row) return null;

  let status = row.status as RecipeStatus;
  let parseError = row.parseError;
  if (isStaleParse(row.status, row.updatedAt)) {
    const resolved = await failStaleParses([row.id]);
    status = resolved.get(row.id) ?? status;
    parseError = "parse-interrupted";
  }

  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType as SourceType,
    servings: row.servings,
    ingredients: row.ingredients,
    prepSteps: row.prepSteps,
    cookingSteps: row.cookingSteps,
    images: row.images,
    originalRecipe: row.originalRecipe,
    mealType: row.mealType as MealType | null,
    cuisine: row.cuisine as Cuisine | null,
    cookStyle: row.cookStyle as CookStyle | null,
    totalTimeMinutes: row.totalTimeMinutes,
    status,
    parseError,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  status: string;
  operations: Operation[] | null;
  previousRecipe: ParsedRecipe | null;
  createdAt: string;
}

export async function getRecipeMessages(
  recipeId: string,
): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(recipeMessages)
    .where(eq(recipeMessages.recipeId, recipeId))
    .orderBy(asc(recipeMessages.createdAt));

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    status: row.status,
    operations: row.operations as Operation[] | null,
    previousRecipe: row.previousRecipe as ParsedRecipe | null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  }));
}

export async function getRecipeSummaries(
  userId: string,
): Promise<RecipeSummary[]> {
  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      sourceUrl: recipes.sourceUrl,
      sourceType: recipes.sourceType,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
      images: recipes.images,
      mealType: recipes.mealType,
      cuisine: recipes.cuisine,
      cookStyle: recipes.cookStyle,
      totalTimeMinutes: recipes.totalTimeMinutes,
      status: recipes.status,
      parseError: recipes.parseError,
      cookCount: count(cookLog.id),
      lastCookedAt: max(cookLog.cookedAt),
    })
    .from(recipes)
    .leftJoin(cookLog, eq(recipes.id, cookLog.recipeId))
    .where(eq(recipes.userId, userId))
    .groupBy(recipes.id)
    .orderBy(
      sql`${max(cookLog.cookedAt)} desc nulls last`,
      desc(recipes.createdAt),
    );

  const staleIds = rows
    .filter((row) => isStaleParse(row.status, row.updatedAt))
    .map((row) => row.id);
  const resolvedStale = await failStaleParses(staleIds);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType as SourceType,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    imageUrl: row.images?.[0]?.url ?? null,
    mealType: row.mealType as MealType | null,
    cuisine: row.cuisine as Cuisine | null,
    cookStyle: row.cookStyle as CookStyle | null,
    totalTimeMinutes: row.totalTimeMinutes,
    status: resolvedStale.get(row.id) ?? (row.status as RecipeStatus),
    parseError: resolvedStale.has(row.id)
      ? "parse-interrupted"
      : row.parseError,
    cookCount: Number(row.cookCount),
    lastCookedAt: row.lastCookedAt
      ? row.lastCookedAt instanceof Date
        ? row.lastCookedAt.toISOString()
        : String(row.lastCookedAt)
      : null,
  }));
}
