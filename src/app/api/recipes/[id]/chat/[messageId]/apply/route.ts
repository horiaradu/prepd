import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, recipeMessages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { applyOperations, validateRecipe } from "@/lib/recipe-operations";
import type { ParsedRecipe } from "@/types/recipe";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await params;

  const [[recipe], [message]] = await Promise.all([
    db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id))),
    db
      .select()
      .from(recipeMessages)
      .where(
        and(
          eq(recipeMessages.id, messageId),
          eq(recipeMessages.recipeId, id),
          eq(recipeMessages.status, "pending"),
        ),
      ),
  ]);

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!message || !message.operations) {
    return NextResponse.json({ error: "Pending edit not found" }, { status: 404 });
  }

  const currentRecipe: ParsedRecipe = {
    title: recipe.title,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    prepSteps: recipe.prepSteps,
    cookingSteps: recipe.cookingSteps,
  };

  const updated = applyOperations(currentRecipe, message.operations);
  const validation = validateRecipe(updated);
  if (!validation.ok) {
    return NextResponse.json(
      { error: `Cannot apply: ${validation.errors.join(", ")}` },
      { status: 422 },
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(recipes)
      .set({
        title: updated.title,
        servings: updated.servings,
        ingredients: updated.ingredients,
        prepSteps: updated.prepSteps,
        cookingSteps: updated.cookingSteps,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id));

    await tx
      .update(recipeMessages)
      .set({ status: "applied" })
      .where(eq(recipeMessages.id, messageId));
  });

  return NextResponse.json({ recipe: updated });
}
