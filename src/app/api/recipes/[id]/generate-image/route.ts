import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { authOptions, isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { generateAndStoreHeroImage } from "@/lib/recipe-image";
import type { Cuisine, MealType, CookStyle } from "@/types/recipe";

export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let newBlobUrl: string | null = null;
  try {
    const { image } = await generateAndStoreHeroImage({
      userId,
      recipeId: id,
      recipe: {
        title: row.title,
        servings: row.servings,
        ingredients: row.ingredients,
        prepSteps: row.prepSteps,
        cookingSteps: row.cookingSteps,
        mealType: row.mealType as MealType | null,
        cuisine: row.cuisine as Cuisine | null,
        cookStyle: row.cookStyle as CookStyle | null,
        totalTimeMinutes: row.totalTimeMinutes,
      },
    });
    newBlobUrl = image.blobUrl ?? null;

    const previousBlobUrl = row.images?.[0]?.blobUrl;
    await db
      .update(recipes)
      .set({ images: [image] })
      .where(eq(recipes.id, id));

    // Don't delete the original uploaded photo; users may want to view or
    // re-parse from it later via the source-image proxy.
    if (previousBlobUrl && previousBlobUrl !== row.sourceUrl) {
      await del(previousBlobUrl).catch(() => {});
    }

    return NextResponse.json({ imageUrl: image.url });
  } catch (error) {
    if (newBlobUrl) await del(newBlobUrl).catch(() => {});
    console.error("Generate image error:", error);
    Sentry.captureException(error, {
      tags: { stage: "image-generate", recipeId: id },
    });
    const message =
      isAdmin(session.user.email) && error instanceof Error
        ? error.message
        : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
