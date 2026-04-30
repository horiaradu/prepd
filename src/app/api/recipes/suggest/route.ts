import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, cookLog } from "@/db/schema";
import { eq, desc, count, max } from "drizzle-orm";
import { suggestRecipes } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : null;
  const history: Array<{ role: "user" | "model"; content: string }> =
    Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const rows = await db
    .select({
      title: recipes.title,
      cookCount: count(cookLog.id),
      lastCookedAt: max(cookLog.cookedAt),
    })
    .from(recipes)
    .leftJoin(cookLog, eq(recipes.id, cookLog.recipeId))
    .where(eq(recipes.userId, session.user.id))
    .groupBy(recipes.id)
    .orderBy(desc(max(cookLog.cookedAt)), desc(recipes.createdAt));

  const recipeContext = rows.length
    ? rows
        .map(
          (r) =>
            `- ${r.title} (cooked ${r.cookCount} times${r.lastCookedAt ? `, last: ${new Date(r.lastCookedAt).toLocaleDateString()}` : ""})`,
        )
        .join("\n")
    : "No recipes saved yet.";

  const result = await suggestRecipes(message, history, recipeContext);

  return NextResponse.json(result);
}
