import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, recipeMessages } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { updateRecipe } from "@/lib/gemini";
import type { ParsedRecipe } from "@/types/recipe";

export async function POST(
  request: NextRequest,
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

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : null;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const currentRecipe: ParsedRecipe = {
    title: recipe.title,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    prepSteps: recipe.prepSteps,
    cookingSteps: recipe.cookingSteps,
  };

  const { recipe: updatedRecipe, summary } = await updateRecipe(
    currentRecipe,
    message,
  );

  await db
    .update(recipes)
    .set({
      title: updatedRecipe.title,
      servings: updatedRecipe.servings,
      ingredients: updatedRecipe.ingredients,
      prepSteps: updatedRecipe.prepSteps,
      cookingSteps: updatedRecipe.cookingSteps,
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, id));

  await db.insert(recipeMessages).values([
    { recipeId: id, role: "user", content: message },
    { recipeId: id, role: "assistant", content: summary },
  ]);

  return NextResponse.json({
    recipe: updatedRecipe,
    summary,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const messages = await db
    .select()
    .from(recipeMessages)
    .where(eq(recipeMessages.recipeId, id))
    .orderBy(asc(recipeMessages.createdAt));

  return NextResponse.json(messages);
}
