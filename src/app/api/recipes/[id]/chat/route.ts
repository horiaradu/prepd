import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, recipeMessages } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { planRecipeEdit } from "@/lib/gemini";
import {
  validateOperations,
  applyOperations,
  validateRecipe,
} from "@/lib/recipe-operations";
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

  // Reject if there is already a pending edit for this recipe
  const [existingPending] = await db
    .select({ id: recipeMessages.id })
    .from(recipeMessages)
    .where(
      and(
        eq(recipeMessages.recipeId, id),
        eq(recipeMessages.status, "pending"),
      ),
    );

  if (existingPending) {
    return NextResponse.json(
      { error: "A pending edit already exists. Apply or discard it first." },
      { status: 409 },
    );
  }

  const currentRecipe: ParsedRecipe = {
    title: recipe.title,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    prepSteps: recipe.prepSteps,
    cookingSteps: recipe.cookingSteps,
  };

  // Load conversation history (last 20 exchanges)
  const history = await db
    .select()
    .from(recipeMessages)
    .where(
      and(
        eq(recipeMessages.recipeId, id),
        eq(recipeMessages.status, "applied"),
      ),
    )
    .orderBy(asc(recipeMessages.createdAt))
    .limit(40);

  const conversationHistory = history.map((m) => ({
    role: m.role as "user" | "model",
    content: m.content,
  }));

  // Plan the edit (with retry on validation failure)
  let operations;
  let summary;

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await planRecipeEdit(
      currentRecipe,
      attempt === 0
        ? message
        : `${message}\n\nPrevious attempt had validation errors: ${(validateOperations(currentRecipe, operations!) as { ok: false; errors: string[] }).errors.join(", ")}. Please fix these.`,
      conversationHistory,
    );
    operations = result.operations;
    summary = result.summary;

    const validation = validateOperations(currentRecipe, operations);
    if (validation.ok) break;

    if (attempt === 1) {
      return NextResponse.json(
        {
          error: `Could not produce valid operations: ${validation.errors.join(", ")}`,
        },
        { status: 422 },
      );
    }
  }

  const preview = applyOperations(currentRecipe, operations!);
  const previewValidation = validateRecipe(preview);
  if (!previewValidation.ok) {
    return NextResponse.json(
      {
        error: `Could not produce a valid recipe: ${previewValidation.errors.join(", ")}`,
      },
      { status: 422 },
    );
  }

  await db
    .insert(recipeMessages)
    .values({
      recipeId: id,
      role: "user",
      content: message,
      status: "applied",
    });

  const [assistantMsg] = await db
    .insert(recipeMessages)
    .values({
      recipeId: id,
      role: "assistant",
      content: summary!,
      status: "pending",
      operations: operations!,
      previousRecipe: currentRecipe,
    })
    .returning();

  return NextResponse.json({
    messageId: assistantMsg.id,
    operations: operations!,
    preview,
    summary: summary!,
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
