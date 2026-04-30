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

export async function POST(request: NextRequest) {
  try {
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

    const sourceType: SourceType = isYoutubeUrl(body.url) ? "youtube" : "web";

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
        const parsed = await parseRecipeFromUrl(body.url);

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
              and(
                eq(recipes.id, replaceId),
                eq(recipes.userId, session.user.id),
              ),
            );
          savedId = replaceId;
        } else {
          const [saved] = await db
            .insert(recipes)
            .values({
              userId: session.user.id,
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

        return NextResponse.json({
          id: savedId,
          recipe: parsed,
          sourceUrl: body.url,
          sourceType,
          imageUrl: null,
        });
      }
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract content from the URL" },
        { status: 422 },
      );
    }

    const parsed = await parseRecipeContent(content, images);

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
        .where(
          and(eq(recipes.id, replaceId), eq(recipes.userId, session.user.id)),
        );
      savedId = replaceId;
    } else {
      const [saved] = await db
        .insert(recipes)
        .values({
          userId: session.user.id,
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

    return NextResponse.json({
      id: savedId,
      recipe: parsed,
      sourceUrl: body.url,
      sourceType,
      imageUrl: images[0]?.url ?? null,
    });
  } catch (error) {
    console.error("Recipe parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse recipe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
