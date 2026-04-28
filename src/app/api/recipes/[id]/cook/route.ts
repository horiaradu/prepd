import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { cookLog, recipes } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the recipe exists and belongs to the user
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id)));

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const tweaks =
    typeof body.tweaks === "string" && body.tweaks.trim()
      ? body.tweaks.trim()
      : null;

  const [entry] = await db
    .insert(cookLog)
    .values({
      recipeId: id,
      userId: session.user.id,
      tweaks,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
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

  const entries = await db
    .select()
    .from(cookLog)
    .where(and(eq(cookLog.recipeId, id), eq(cookLog.userId, session.user.id)))
    .orderBy(desc(cookLog.cookedAt));

  return NextResponse.json(entries);
}
