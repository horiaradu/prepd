import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { getYoutubeThumbnailUrl } from "@/lib/youtube";
import { extractWebPage, ScrapeError } from "@/lib/scraper";
import { downloadReelVideo, resolveReel, type ReelVideo } from "@/lib/reel";
import {
  NoRecipeFoundError,
  parseRecipeContent,
  parseRecipeFromUrl,
  parseRecipeFromVideo,
  parseRecipeFromVideoBytes,
} from "@/lib/gemini";
import { persistRecipeImages } from "@/lib/recipe-image";
import { notifyParseOutcome } from "@/lib/parse-notify";
import type { ParsedRecipe, RecipeImage, SourceType } from "@/types/recipe";

export interface RunRecipeParseArgs {
  recipeId: string;
  url: string;
  sourceType: SourceType;
  language: string;
  userId: string;
  // A reparse keeps the recipe's existing content on failure; a fresh parse
  // flips to "failed".
  isReparse: boolean;
  // Admin account: store the underlying error text instead of a reason key.
  detailedErrors: boolean;
}

// The full parse, run in the background (via after()) once the POST has
// already returned the recipe id. Content lands first and flips the row to
// "ready"; images are persisted afterwards and fill in when done.
export async function runRecipeParse(args: RunRecipeParseArgs): Promise<void> {
  const {
    recipeId,
    url,
    sourceType,
    language,
    userId,
    isReparse,
    detailedErrors,
  } = args;
  const sourceHost = new URL(url).hostname;
  let stage = "scrape";

  let parsed: ParsedRecipe;
  let images: RecipeImage[];

  try {
    let rawContent: string | null;

    if (sourceType === "youtube") {
      stage = "gemini-youtube";
      parsed = await parseRecipeFromVideo(
        { fileUri: url, mimeType: "video/*" },
        language,
      );
      const thumb = getYoutubeThumbnailUrl(url);
      images = thumb ? [{ url: thumb }] : [];
      rawContent = null;
    } else if (sourceType === "instagram" || sourceType === "facebook") {
      stage = "reel-resolve";
      const reel = await resolveReel(url, sourceType);
      images = reel.thumbnailUrl ? [{ url: reel.thumbnailUrl }] : [];
      rawContent = reel.caption;

      // The video carries what the caption leaves out (spoken or on-screen
      // steps); when it cannot be fetched, the caption alone often still
      // holds the full recipe.
      let video: ReelVideo | null = null;
      if (reel.videoUrl) {
        stage = "reel-video";
        try {
          video = await downloadReelVideo(reel.videoUrl);
        } catch (err) {
          console.error(
            `Reel video download failed for ${url}, falling back to caption:`,
            err,
          );
          Sentry.captureException(err, {
            tags: { stage, sourceType, sourceHost },
          });
        }
      }

      if (video) {
        stage = "gemini-video";
        parsed = await parseRecipeFromVideoBytes(video, reel.caption, language);
      } else if (reel.caption) {
        stage = "gemini-parse";
        parsed = await parseRecipeContent(reel.caption, undefined, language);
      } else {
        throw new Error("Reel has neither a playable video nor a caption");
      }
    } else {
      let extracted: { content: string; images: RecipeImage[] } | null;
      try {
        extracted = await extractWebPage(url);
      } catch (err) {
        console.error(
          `Scraper failed for ${url}, falling back to Gemini URL context:`,
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
        stage = "gemini-parse";
        parsed = await parseRecipeContent(
          extracted.content,
          extracted.images,
          language,
        );
        images = extracted.images;
        rawContent = extracted.content;
      } else {
        stage = "gemini-url-fallback";
        const result = await parseRecipeFromUrl(url, language);
        parsed = result.recipe;
        images = result.images;
        rawContent = null;
      }
    }

    stage = "save";
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
        originalRecipe: parsed,
        rawContent,
        language,
        status: "ready",
        parseError: null,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));
  } catch (error) {
    console.error("Recipe parse error:", error);
    Sentry.captureException(error, {
      tags: { stage, sourceType, sourceHost },
    });
    const reason =
      error instanceof NoRecipeFoundError
        ? "no-recipe-found"
        : detailedErrors
          ? `[${stage}] ${error instanceof Error ? error.message : String(error)}`
          : "parse-failed";
    try {
      await db
        .update(recipes)
        .set({
          // A failed reparse keeps the previous content usable.
          status: isReparse ? "ready" : "failed",
          parseError: reason,
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipeId));
    } catch (dbError) {
      console.error("Failed to record parse failure:", dbError);
      Sentry.captureException(dbError, {
        tags: { stage: "record-failure", sourceType, sourceHost },
      });
    }
    await notifyParseOutcome({
      userId,
      language,
      outcome: {
        ok: false,
        reason,
        url: isReparse ? `/recipe/${recipeId}` : "/",
      },
    });
    return;
  }

  // Image persistence failures never invalidate the recipe — the content is
  // already saved and "ready".
  try {
    stage = "image-persist";
    const result = await persistRecipeImages({
      userId,
      recipeId,
      recipe: parsed,
      images,
      generateFallbackHero: !isReparse,
    });
    // A reparse that surfaced no images keeps whatever the recipe had.
    if (result.images.length > 0 || !isReparse) {
      await db
        .update(recipes)
        .set({
          images: result.images,
          prepSteps: result.prepSteps,
          cookingSteps: result.cookingSteps,
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipeId));
    }
  } catch (error) {
    console.error("Recipe image persistence failed:", error);
    Sentry.captureException(error, {
      tags: { stage, sourceType, sourceHost },
    });
  }

  await notifyParseOutcome({
    userId,
    language,
    outcome: { ok: true, title: parsed.title, recipeId },
  });
}
