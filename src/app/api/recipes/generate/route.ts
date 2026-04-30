import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { generateRecipe } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const description =
    typeof body.description === "string" ? body.description.trim() : null;

  if (!description) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 },
    );
  }

  const parsed = await generateRecipe(description);

  const [saved] = await db
    .insert(recipes)
    .values({
      userId: session.user.id,
      title: parsed.title,
      sourceUrl: "",
      sourceType: "web",
      servings: parsed.servings,
      ingredients: parsed.ingredients,
      prepSteps: parsed.prepSteps,
      cookingSteps: parsed.cookingSteps,
      images: [],
      originalRecipe: parsed,
      rawContent: description,
    })
    .returning();

  return NextResponse.json({ id: saved.id, recipe: parsed }, { status: 201 });
}
