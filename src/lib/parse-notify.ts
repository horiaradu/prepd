import { sendPushToUserId } from "@/lib/push";
import { getTranslations } from "@/lib/i18n";
import { parseErrorMessage } from "@/lib/parse-error";

// Push sent when a background parse settles. The service worker suppresses it
// when the app is focused, so it only surfaces on backgrounded/closed
// devices. Push failures never affect the parse result.
export async function notifyParseOutcome(args: {
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
