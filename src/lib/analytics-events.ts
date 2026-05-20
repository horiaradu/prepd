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

export function trackRecipeListFiltered(params: {
  filter_category: "meal_type" | "cuisine" | "cook_style" | "time" | "cooked";
  filter_value: string;
}) {
  send({ event: "recipe_list_filtered", ...params });
}

export function trackRecipeTagChanged(params: {
  recipeId: string;
  tag_category: "meal_type" | "cuisine" | "cook_style" | "time";
  tag_value: string;
}) {
  send({
    event: "recipe_tag_changed",
    recipe_id: params.recipeId,
    tag_category: params.tag_category,
    tag_value: params.tag_value,
  });
}
