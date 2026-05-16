import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { generateAndStoreHeroImage } from "@/lib/recipe-image";

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
    const { image, proxyUrl } = await generateAndStoreHeroImage({
      userId,
      recipeId: id,
      recipe: {
        title: row.title,
        servings: row.servings,
        ingredients: row.ingredients,
        prepSteps: row.prepSteps,
        cookingSteps: row.cookingSteps,
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

    return NextResponse.json({ imageUrl: proxyUrl });
  } catch (error) {
    if (newBlobUrl) await del(newBlobUrl).catch(() => {});
    console.error("Generate image error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
