import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, recipeMessages } from "@/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id)));

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Find the most recent applied assistant message that has a stored previous state
  const [message] = await db
    .select()
    .from(recipeMessages)
    .where(
      and(
        eq(recipeMessages.recipeId, id),
        eq(recipeMessages.role, "assistant"),
        eq(recipeMessages.status, "applied"),
        isNotNull(recipeMessages.previousRecipe),
      ),
    )
    .orderBy(desc(recipeMessages.createdAt))
    .limit(1);

  if (!message || !message.previousRecipe) {
    return NextResponse.json(
      { error: "Nothing to undo" },
      { status: 404 },
    );
  }

  const previous = message.previousRecipe;

  await db.transaction(async (tx) => {
    await tx
      .update(recipes)
      .set({
        title: previous.title,
        servings: previous.servings,
        ingredients: previous.ingredients,
        prepSteps: previous.prepSteps,
        cookingSteps: previous.cookingSteps,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id));

    await tx
      .update(recipeMessages)
      .set({ status: "reverted" })
      .where(eq(recipeMessages.id, message.id));
  });

  return NextResponse.json({ recipe: previous });
}
