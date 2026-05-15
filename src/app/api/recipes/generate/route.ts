import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { generateRecipe } from "@/lib/gemini";
import { isValidLocale, LOCALE_COOKIE } from "@/lib/i18n";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

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

  const userId = session.user.id;
  const rawLocale = request.cookies.get(LOCALE_COOKIE)?.value ?? "en";
  const language = isValidLocale(rawLocale) ? rawLocale : "en";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));

      try {
        send({
          type: "progress",
          step: "Generating recipe…",
          progress: 20,
        });

        const parsed = await generateRecipe(description, language);

        send({ type: "progress", step: "Saving recipe…", progress: 80 });

        const [saved] = await db
          .insert(recipes)
          .values({
            userId,
            title: parsed.title,
            sourceUrl: "",
            sourceType: "web",
            language,
            servings: parsed.servings,
            ingredients: parsed.ingredients,
            prepSteps: parsed.prepSteps,
            cookingSteps: parsed.cookingSteps,
            images: [],
            originalRecipe: parsed,
            rawContent: description,
          })
          .returning();

        send({
          type: "done",
          data: { id: saved.id, recipe: parsed },
        });
      } catch (error) {
        console.error("Recipe generate error:", error);
        const message =
          error instanceof Error ? error.message : "Failed to generate recipe";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
