import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { NoRecipeFoundError, parseRecipeFromImage } from "@/lib/gemini";
import { notifyParseOutcome } from "@/lib/parse-notify";

export interface RunImageParseArgs {
  recipeId: string;
  userId: string;
  language: string;
  images: { bytes: Buffer; mimeType: string }[];
  // A reparse keeps the recipe's existing content on failure; a fresh parse
  // flips to "failed".
  isReparse: boolean;
  detailedErrors: boolean;
}

// OCRs the recipe's source photos in the background (via after()) once the
// POST has returned the recipe id. The source images are already uploaded
// and set on the row; this only fills in the parsed content.
export async function runImageParse(args: RunImageParseArgs): Promise<void> {
  const { recipeId, userId, language, images, isReparse, detailedErrors } =
    args;

  try {
    const parsed = await parseRecipeFromImage(images, language);
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
        status: "ready",
        parseError: null,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));

    await notifyParseOutcome({
      userId,
      language,
      outcome: { ok: true, title: parsed.title, recipeId },
    });
  } catch (error) {
    console.error("Recipe image parse error:", error);
    Sentry.captureException(error, {
      tags: { stage: "parse-image", sourceType: "image" },
    });
    const reason =
      error instanceof NoRecipeFoundError
        ? "no-recipe-found"
        : detailedErrors
          ? error instanceof Error
            ? error.message
            : String(error)
          : "parse-failed";
    try {
      await db
        .update(recipes)
        .set({
          status: isReparse ? "ready" : "failed",
          parseError: reason,
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipeId));
    } catch (dbError) {
      console.error("Failed to record image parse failure:", dbError);
      Sentry.captureException(dbError, {
        tags: { stage: "record-failure", sourceType: "image" },
      });
    }
    await notifyParseOutcome({
      userId,
      language,
      outcome: { ok: false, reason, url: `/recipe/${recipeId}` },
    });
  }
}
