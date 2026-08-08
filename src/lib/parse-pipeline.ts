import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { getYoutubeThumbnailUrl } from "@/lib/youtube";
import { extractWebPage, ScrapeError } from "@/lib/scraper";
import {
  NoRecipeFoundError,
  parseRecipeContent,
  parseRecipeFromUrl,
  parseRecipeFromYoutube,
} from "@/lib/gemini";
import { persistRecipeImages } from "@/lib/recipe-image";
import { sendPushToUserId } from "@/lib/push";
import { getTranslations } from "@/lib/i18n";
import { parseErrorMessage } from "@/lib/parse-error";
import type { ParsedRecipe, RecipeImage, SourceType } from "@/types/recipe";

// The service worker suppresses the notification when the app is focused,
// so this only surfaces on backgrounded/closed devices. Push failures never
// affect the parse result.
async function notifyParseOutcome(args: {
  userId: string;
  language: string;
  outcome:
    | { ok: true; title: string; recipeId: string }
    | { ok: false; reason: string; url: string };
}): Promise<void> {
  const { userId, language, outcome } = args;
  const t = getTranslations(language);
  try {
    await sendPushToUserId(
      userId,
      outcome.ok
        ? {
            title: outcome.title,
            body: t.notifyRecipeReadyBody,
            url: `/recipe/${outcome.recipeId}`,
          }
        : {
            title: t.notifyParseFailedTitle,
            body: parseErrorMessage(outcome.reason, t),
            url: outcome.url,
          },
    );
  } catch (err) {
    console.error("Parse completion push failed:", err);
  }
}

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
      parsed = await parseRecipeFromYoutube(url, language);
      const thumb = getYoutubeThumbnailUrl(url);
      images = thumb ? [{ url: thumb }] : [];
      rawContent = null;
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
