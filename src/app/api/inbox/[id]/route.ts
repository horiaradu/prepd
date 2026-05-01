import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares, recipes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { SourceType } from "@/types/recipe";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action;

  if (action !== "accept" && action !== "discard") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [share] = await db
    .select()
    .from(recipeShares)
    .where(
      and(
        eq(recipeShares.id, id),
        eq(recipeShares.recipientEmail, session.user.email.toLowerCase()),
      ),
    );

  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (share.status !== "pending") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }

  if (action === "accept") {
    const snap = share.recipeSnapshot;
    const [inserted] = await db
      .insert(recipes)
      .values({
        userId: session.user.id,
        title: snap.title,
        servings: snap.servings,
        ingredients: snap.ingredients,
        prepSteps: snap.prepSteps,
        cookingSteps: snap.cookingSteps,
        images: snap.images,
        sourceUrl: snap.sourceUrl,
        sourceType: snap.sourceType as SourceType,
      })
      .returning({ id: recipes.id });

    // Update image urls to reference the new recipe's image endpoint so they
    // remain accessible to the recipient after the share is consumed.
    if (inserted && snap.images?.length) {
      const updatedImages = snap.images.map((img, i) =>
        i === 0 && img.blobUrl
          ? { ...img, url: `/api/recipes/${inserted.id}/image` }
          : img,
      );
      await db
        .update(recipes)
        .set({ images: updatedImages })
        .where(eq(recipes.id, inserted.id));
    }
  }

  await db
    .update(recipeShares)
    .set({ status: action === "accept" ? "accepted" : "discarded" })
    .where(eq(recipeShares.id, id));

  return NextResponse.json({
    status: action === "accept" ? "accepted" : "discarded",
  });
}
