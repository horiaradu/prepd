import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, recipeMessages } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
  if (!message) {
    return NextResponse.json({ error: "Pending edit not found" }, { status: 404 });
  }

  await db
    .update(recipeMessages)
    .set({ status: "discarded" })
    .where(eq(recipeMessages.id, messageId));

  return NextResponse.json({ ok: true });
}
