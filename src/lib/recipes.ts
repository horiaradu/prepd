import { db } from "@/db";
import { recipes, cookLog, recipeMessages } from "@/db/schema";
import { and, eq, desc, asc, count, max } from "drizzle-orm";
import type { Recipe, RecipeSummary, SourceType } from "@/types/recipe";

export async function getRecipe(
  id: string,
  userId: string,
): Promise<Recipe | null> {
  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

  if (!row) return null;

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
      images: recipes.images,
      cookCount: count(cookLog.id),
      lastCookedAt: max(cookLog.cookedAt),
    })
    .from(recipes)
    .leftJoin(cookLog, eq(recipes.id, cookLog.recipeId))
    .where(eq(recipes.userId, userId))
    .groupBy(recipes.id)
    .orderBy(desc(max(cookLog.cookedAt)), desc(recipes.createdAt));

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
    cookCount: Number(row.cookCount),
    lastCookedAt: row.lastCookedAt
      ? row.lastCookedAt instanceof Date
        ? row.lastCookedAt.toISOString()
        : String(row.lastCookedAt)
      : null,
  }));
}
