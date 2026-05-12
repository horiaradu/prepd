import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isYoutubeUrl, getYoutubeThumbnailUrl } from "@/lib/youtube";
import { extractWebPage } from "@/lib/scraper";
import {
  parseRecipeContent,
  parseRecipeFromUrl,
  parseRecipeFromYoutube,
} from "@/lib/gemini";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  ParseRequest,
  SourceType,
  RecipeImage,
  ParsedRecipe,
} from "@/types/recipe";

async function upsertRecipe(args: {
  userId: string;
  replaceId: string | undefined;
  sourceUrl: string;
  sourceType: SourceType;
  parsed: ParsedRecipe;
  images: RecipeImage[];
  rawContent: string | null;
}): Promise<string> {
  const {
    userId,
    replaceId,
    sourceUrl,
    sourceType,
    parsed,
    images,
    rawContent,
  } = args;

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
        rawContent,
      })
      .where(and(eq(recipes.id, replaceId), eq(recipes.userId, userId)));
    return replaceId;
  }

  const [saved] = await db
    .insert(recipes)
    .values({
      userId,
      title: parsed.title,
      sourceUrl,
      sourceType,
      servings: parsed.servings,
      ingredients: parsed.ingredients,
      prepSteps: parsed.prepSteps,
      cookingSteps: parsed.cookingSteps,
      images,
      originalRecipe: parsed,
      rawContent,
    })
    .returning();
  return saved.id;
}

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

        let parsed: ParsedRecipe;
        let images: RecipeImage[];
        let rawContent: string | null;

        if (sourceType === "youtube") {
          send({
            type: "progress",
            step: "Analyzing video…",
            progress: 40,
          });
          parsed = await parseRecipeFromYoutube(body.url);
          const thumb = getYoutubeThumbnailUrl(body.url);
          images = thumb ? [{ url: thumb }] : [];
          rawContent = null;
        } else {
          let extracted: { content: string; images: RecipeImage[] } | null;
          try {
            extracted = await extractWebPage(body.url);
          } catch {
            extracted = null;
          }

          if (extracted && extracted.content.trim().length > 0) {
            send({
              type: "progress",
              step: "Analyzing recipe…",
              progress: 40,
            });
            parsed = await parseRecipeContent(
              extracted.content,
              extracted.images,
            );
            images = extracted.images;
            rawContent = extracted.content;
          } else {
            // Scraping failed or returned empty — fall back to Gemini URL context
            send({
              type: "progress",
              step: "Analyzing recipe from URL…",
              progress: 40,
            });
            parsed = await parseRecipeFromUrl(body.url);
            images = [];
            rawContent = null;
          }
        }

        send({ type: "progress", step: "Saving recipe…", progress: 85 });
        const savedId = await upsertRecipe({
          userId,
          replaceId,
          sourceUrl: body.url,
          sourceType,
          parsed,
          images,
          rawContent,
        });

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
