import { sendGTMEvent } from "@next/third-parties/google";

export type RecipeSource = "web" | "youtube" | "image" | "email";

export function send(data: Record<string, unknown>) {
  try {
    sendGTMEvent(data);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("analytics send failed", err);
    }
  }
}

export function trackRecipeParsed(params: {
  recipeId: string;
  source: RecipeSource;
}) {
  send({
    event: "recipe_parsed",
    recipe_id: params.recipeId,
    source: params.source,
  });
}

export function trackRecipeShared(params: { recipeId: string }) {
  send({ event: "recipe_shared", recipe_id: params.recipeId });
}

export function trackChatMessageSent(params: { recipeId: string }) {
  send({ event: "recipe_chat_message_sent", recipe_id: params.recipeId });
}

export function trackChatChangesApplied(params: { recipeId: string }) {
  send({ event: "recipe_chat_changes_applied", recipe_id: params.recipeId });
}

export function trackChatChangesDiscarded(params: { recipeId: string }) {
  send({ event: "recipe_chat_changes_discarded", recipe_id: params.recipeId });
}

export function trackRecipeReparsed(params: { recipeId: string }) {
  send({ event: "recipe_reparsed", recipe_id: params.recipeId });
}

export function trackImageGenerated(params: { recipeId: string }) {
  send({ event: "image_generated", recipe_id: params.recipeId });
}

export function trackLogin() {
  send({ event: "login", method: "google" });
}

export function trackSignup() {
  send({ event: "signup", method: "google" });
}
