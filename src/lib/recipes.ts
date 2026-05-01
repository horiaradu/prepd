import { db } from "@/db";
import { recipes, cookLog } from "@/db/schema";
import { eq, desc, count, max } from "drizzle-orm";
import type { RecipeSummary, SourceType } from "@/types/recipe";

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
