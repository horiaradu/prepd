import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, cookLog } from "@/db/schema";
import { eq, desc, count, max } from "drizzle-orm";
import { suggestRecipesStream } from "@/lib/gemini";

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
      id: recipes.id,
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

  const encoder = new TextEncoder();
  const recipesPayload = rows.map((r) => ({ id: r.id, title: r.title }));

  const stream = await suggestRecipesStream(message, history, recipeContext);

  const wrappedStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "recipes", recipes: recipesPayload })}\n\n`,
        ),
      );
      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(wrappedStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
