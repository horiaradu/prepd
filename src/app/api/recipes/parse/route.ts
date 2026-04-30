import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isYoutubeUrl,
  extractYoutubeTranscript,
  getYoutubeThumbnailUrl,
} from "@/lib/youtube";
import { extractWebPage } from "@/lib/scraper";
import { parseRecipeContent, parseRecipeFromUrl } from "@/lib/gemini";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ParseRequest, SourceType, RecipeImage } from "@/types/recipe";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ParseRequest;

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const replaceId = body.replaceId;

  let url: URL;
  try {
    url = new URL(body.url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(url.protocol)) {
    return NextResponse.json(
      { error: "Only HTTP/HTTPS URLs are supported" },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const sourceType: SourceType = isYoutubeUrl(body.url) ? "youtube" : "web";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));

      try {
        send({ type: "progress", step: "Extracting content…", progress: 15 });

        let content: string;
        let images: RecipeImage[];

        if (sourceType === "youtube") {
          content = await extractYoutubeTranscript(body.url);
          const thumb = getYoutubeThumbnailUrl(body.url);
          images = thumb ? [{ url: thumb }] : [];
        } else {
          try {
            const extracted = await extractWebPage(body.url);
            content = extracted.content;
            images = extracted.images;
          } catch {
            // Scraping failed (403, Cloudflare, etc.) — use Gemini URL context
            send({
              type: "progress",
              step: "Analyzing recipe from URL…",
              progress: 40,
            });
            const parsed = await parseRecipeFromUrl(body.url);

            send({ type: "progress", step: "Saving recipe…", progress: 85 });
            let savedId: string;
            if (replaceId) {
              await db
                .update(recipes)
                .set({
                  title: parsed.title,
                  servings: parsed.servings,
                  ingredients: parsed.ingredients,
                  prepSteps: parsed.prepSteps,
                  cookingSteps: parsed.cookingSteps,
                  images: [],
                  originalRecipe: parsed,
                  rawContent: null,
                })
                .where(
                  and(eq(recipes.id, replaceId), eq(recipes.userId, userId)),
                );
              savedId = replaceId;
            } else {
              const [saved] = await db
                .insert(recipes)
                .values({
                  userId,
                  title: parsed.title,
                  sourceUrl: body.url,
                  sourceType,
                  servings: parsed.servings,
                  ingredients: parsed.ingredients,
                  prepSteps: parsed.prepSteps,
                  cookingSteps: parsed.cookingSteps,
                  images: [],
                  originalRecipe: parsed,
                  rawContent: null,
                })
                .returning();
              savedId = saved.id;
            }

            send({
              type: "done",
              data: {
                id: savedId,
                recipe: parsed,
                sourceUrl: body.url,
                sourceType,
                imageUrl: null,
              },
            });
            controller.close();
            return;
          }
        }

        if (!content || content.trim().length === 0) {
          send({
            type: "error",
            error: "Could not extract content from the URL",
          });
          controller.close();
          return;
        }

        send({ type: "progress", step: "Analyzing recipe…", progress: 40 });
        const parsed = await parseRecipeContent(content, images);

        send({ type: "progress", step: "Saving recipe…", progress: 85 });
        let savedId: string;
        if (replaceId) {
          await db
            .update(recipes)
            .set({
              title: parsed.title,
              servings: parsed.servings,
              ingredients: parsed.ingredients,
              prepSteps: parsed.prepSteps,
              cookingSteps: parsed.cookingSteps,
              images,
              originalRecipe: parsed,
              rawContent: content,
            })
            .where(and(eq(recipes.id, replaceId), eq(recipes.userId, userId)));
          savedId = replaceId;
        } else {
          const [saved] = await db
            .insert(recipes)
            .values({
              userId,
              title: parsed.title,
              sourceUrl: body.url,
              sourceType,
              servings: parsed.servings,
              ingredients: parsed.ingredients,
              prepSteps: parsed.prepSteps,
              cookingSteps: parsed.cookingSteps,
              images,
              originalRecipe: parsed,
              rawContent: content,
            })
            .returning();
          savedId = saved.id;
        }

        send({
          type: "done",
          data: {
            id: savedId,
            recipe: parsed,
            sourceUrl: body.url,
            sourceType,
            imageUrl: images[0]?.url ?? null,
          },
        });
      } catch (error) {
        console.error("Recipe parse error:", error);
        const message =
          error instanceof Error ? error.message : "Failed to parse recipe";
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
