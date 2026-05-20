import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, recipeShares } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";
import type { MealType, CookStyle } from "@/types/recipe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const recipientEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!recipientEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id)));

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [share] = await db
    .insert(recipeShares)
    .values({
      senderUserId: session.user.id,
      recipientEmail,
      recipeSnapshot: {
        title: recipe.title,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        prepSteps: recipe.prepSteps,
        cookingSteps: recipe.cookingSteps,
        images: recipe.images ?? [],
        sourceUrl: recipe.sourceUrl,
        sourceType: recipe.sourceType,
        language: recipe.language,
        mealType: recipe.mealType as MealType | null,
        cuisine: recipe.cuisine,
        cookStyle: recipe.cookStyle as CookStyle | null,
        totalTimeMinutes: recipe.totalTimeMinutes,
      },
    })
    .returning({ id: recipeShares.id });

  await sendPushToUser(recipientEmail, {
    title: "Recipe shared with you!",
    body: `${session.user.email} sent you "${recipe.title}"`,
    url: "/inbox",
  });

  return NextResponse.json({ id: share.id });
}
