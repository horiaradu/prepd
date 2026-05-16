import { sendGTMEvent } from "@next/third-parties/google";

export type RecipeSource = "web" | "youtube" | "image" | "email";

export function trackRecipeParsed(params: {
  recipeId: string;
  source: RecipeSource;
}) {
  sendGTMEvent({
    event: "recipe_parsed",
    recipe_id: params.recipeId,
    source: params.source,
  });
}

export function trackRecipeShared(params: { recipeId: string }) {
  sendGTMEvent({
    event: "recipe_shared",
    recipe_id: params.recipeId,
  });
}

export function trackChatMessageSent(params: { recipeId: string }) {
  sendGTMEvent({
    event: "recipe_chat_message_sent",
    recipe_id: params.recipeId,
  });
}

export function trackChatChangesApplied(params: { recipeId: string }) {
  sendGTMEvent({
    event: "recipe_chat_changes_applied",
    recipe_id: params.recipeId,
  });
}

export function trackRecipeReparsed(params: { recipeId: string }) {
  sendGTMEvent({
    event: "recipe_reparsed",
    recipe_id: params.recipeId,
  });
}

export function trackImageGenerated(params: { recipeId: string }) {
  sendGTMEvent({
    event: "image_generated",
    recipe_id: params.recipeId,
  });
}

export function trackLogin() {
  sendGTMEvent({ event: "login", method: "google" });
}

export function trackSignup() {
  sendGTMEvent({ event: "signup", method: "google" });
}
