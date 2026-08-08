import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { authOptions, isAdmin } from "@/lib/auth";
import { isYoutubeUrl, getYoutubeThumbnailUrl } from "@/lib/youtube";
import { extractWebPage, ScrapeError } from "@/lib/scraper";
import {
  NoRecipeFoundError,
  parseRecipeContent,
  parseRecipeFromUrl,
  parseRecipeFromYoutube,
} from "@/lib/gemini";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidLocale, LOCALE_COOKIE, getTranslations } from "@/lib/i18n";
import {
  findFirstWorkingImage,
  generateAndStoreHeroImage,
} from "@/lib/recipe-image";
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
  language: string;
  parsed: ParsedRecipe;
  images: RecipeImage[];
  rawContent: string | null;
}): Promise<string> {
  const {
    userId,
    replaceId,
    sourceUrl,
    sourceType,
    language,
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
        mealType: parsed.mealType,
        cuisine: parsed.cuisine,
        cookStyle: parsed.cookStyle,
        totalTimeMinutes: parsed.totalTimeMinutes,
        images,
        originalRecipe: parsed,
        rawContent,
        language,
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
      language,
      servings: parsed.servings,
      ingredients: parsed.ingredients,
      prepSteps: parsed.prepSteps,
      cookingSteps: parsed.cookingSteps,
      mealType: parsed.mealType,
      cuisine: parsed.cuisine,
      cookStyle: parsed.cookStyle,
      totalTimeMinutes: parsed.totalTimeMinutes,
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

export const maxDuration = 60;

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
  const sourceHost = url.hostname;
  const rawLocale = request.cookies.get(LOCALE_COOKIE)?.value ?? "en";
  const language = isValidLocale(rawLocale) ? rawLocale : "en";
  const t = getTranslations(language);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));

      // Pipeline stage, used to tag Sentry events when a parse fails.
      let stage = "scrape";

      try {
        send({ type: "progress", step: t.stepExtractingContent, progress: 15 });

        let parsed: ParsedRecipe;
        let images: RecipeImage[];
        let rawContent: string | null;

        if (sourceType === "youtube") {
          send({
            type: "progress",
            step: t.stepAnalyzingVideo,
            progress: 40,
          });
          stage = "gemini-youtube";
          parsed = await parseRecipeFromYoutube(body.url, language);
          const thumb = getYoutubeThumbnailUrl(body.url);
          images = thumb ? [{ url: thumb }] : [];
          rawContent = null;
        } else {
          let extracted: { content: string; images: RecipeImage[] } | null;
          try {
            extracted = await extractWebPage(body.url);
          } catch (err) {
            console.error(
              `Scraper failed for ${body.url}, falling back to Gemini URL context:`,
              err,
            );
            const tags: Record<string, string> = {
              stage: "scrape",
              sourceType,
              sourceHost,
            };
            if (err instanceof ScrapeError) {
              tags.fetchTier = err.tier;
              if (err.status) tags.httpStatus = String(err.status);
              if (err.directStatus)
                tags.directHttpStatus = String(err.directStatus);
            }
            Sentry.captureException(err, { tags });
            extracted = null;
          }

          if (extracted && extracted.content.trim().length > 0) {
            send({
              type: "progress",
              step: t.stepAnalyzingRecipe,
              progress: 40,
            });
            stage = "gemini-parse";
            parsed = await parseRecipeContent(
              extracted.content,
              extracted.images,
              language,
            );
            images = extracted.images;
            rawContent = extracted.content;
          } else {
            // Scraping failed or returned empty — fall back to Gemini URL context
            send({
              type: "progress",
              step: t.stepAnalyzingRecipeFromUrl,
              progress: 40,
            });
            stage = "gemini-url-fallback";
            const result = await parseRecipeFromUrl(body.url, language);
            parsed = result.recipe;
            images = result.images;
            rawContent = null;
          }
        }

        send({ type: "progress", step: t.stepSavingRecipe, progress: 85 });
        stage = "save";
        const savedId = await upsertRecipe({
          userId,
          replaceId,
          sourceUrl: body.url,
          sourceType,
          language,
          parsed,
          images,
          rawContent,
        });

        // Ensure the recipe has a working hero image. On a fresh parse, if no
        // extracted URL resolves to an actual image, generate one inline.
        // Reparses (replaceId set) skip auto-generation so we don't burn
        // credits or orphan a prior generated hero.
        let finalImageUrl = images[0]?.url ?? null;
        stage = "image-check";
        const working = await findFirstWorkingImage(images);
        if (working) {
          if (working.url !== images[0]?.url) {
            const reordered: RecipeImage[] = [
              working,
              ...images.filter((img) => img.url !== working.url),
            ];
            await db
              .update(recipes)
              .set({ images: reordered })
              .where(eq(recipes.id, savedId));
            finalImageUrl = working.url;
          }
        } else if (!replaceId) {
          try {
            send({
              type: "progress",
              step: t.stepGeneratingImage,
              progress: 92,
            });
            stage = "image-generate";
            const { image, proxyUrl } = await generateAndStoreHeroImage({
              userId,
              recipeId: savedId,
              recipe: parsed,
            });
            await db
              .update(recipes)
              .set({ images: [image] })
              .where(eq(recipes.id, savedId));
            finalImageUrl = proxyUrl;
          } catch (err) {
            console.error("Inline hero image generation failed:", err);
            Sentry.captureException(err, {
              tags: { stage: "image-generate", sourceType, sourceHost },
            });
          }
        }

        send({
          type: "done",
          data: {
            id: savedId,
            recipe: parsed,
            sourceUrl: body.url,
            sourceType,
            imageUrl: finalImageUrl,
          },
        });
      } catch (error) {
        console.error("Recipe parse error:", error);
        Sentry.captureException(error, {
          tags: { stage, sourceType, sourceHost },
        });
        // The admin sees the underlying error for debugging; everyone else
        // gets a translated message (the detail lives in Sentry).
        const message =
          error instanceof NoRecipeFoundError
            ? t.errorNoRecipeFound
            : isAdmin(session.user.email)
              ? `[${stage}] ${error instanceof Error ? error.message : String(error)}`
              : t.errorParseFailed;
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
