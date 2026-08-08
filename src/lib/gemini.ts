import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse, Schema } from "@google/genai";
import {
  COOK_STYLES,
  CUISINES,
  MEAL_TYPES,
  type CookStyle,
  type Cuisine,
  type MealType,
  type ParsedRecipe,
  type RecipeImage,
} from "@/types/recipe";
import type { Operation } from "@/lib/recipe-operations";

const INGREDIENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
    unit: {
      type: Type.STRING,
      enum: ["g", "kg", "ml", "l", "tsp", "tbsp", "piece", "pinch", "to taste"],
    },
    notes: { type: Type.STRING },
  },
  required: ["name", "quantity", "unit"],
};

const STEP_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    instruction: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: INGREDIENT_SCHEMA },
    imageUrl: { type: Type.STRING },
    videoTimestamp: { type: Type.NUMBER },
  },
  required: ["instruction", "ingredients"],
};

const PARSED_RECIPE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    servings: { type: Type.NUMBER, nullable: true },
    ingredients: { type: Type.ARRAY, items: INGREDIENT_SCHEMA },
    prepSteps: { type: Type.ARRAY, items: STEP_SCHEMA },
    cookingSteps: { type: Type.ARRAY, items: STEP_SCHEMA },
    mealType: {
      type: Type.STRING,
      enum: [...MEAL_TYPES],
      nullable: true,
    },
    cuisine: { type: Type.STRING, nullable: true },
    cookStyle: {
      type: Type.STRING,
      enum: [...COOK_STYLES],
      nullable: true,
    },
    totalTimeMinutes: { type: Type.NUMBER, nullable: true },
  },
  required: ["title", "ingredients", "prepSteps", "cookingSteps"],
};

const RECIPE_PARSING_PROMPT_BASE = `You are a recipe extraction assistant. Your job is to take raw recipe content (from a webpage or video transcript) and return a clean, structured recipe.

Rules:
1. Convert ALL quantities to the metric system (grams, kilograms, milliliters, liters). Convert Fahrenheit to Celsius.
2. Use these units only: g, kg, ml, l, tsp, tbsp, piece, pinch, to taste
   - Keep tsp and tbsp as-is (they are practical for small quantities)
   - Convert cups, ounces, pounds, quarts, etc. to metric equivalents
   - "quantity" MUST be a number. If the source does not specify an amount for an ingredient (e.g. "currants for garnish"), use unit "to taste" with quantity 0. Never omit quantity, never return null, never return a string.
3. Separate steps into two categories:
   - PREP STEPS: anything done before heat is applied — washing, cutting, chopping, slicing, dicing, marinating, mixing dry ingredients, whisking, zesting, measuring, etc.
   - COOKING STEPS: anything involving heat or time-dependent processes — sautéing, boiling, baking, frying, simmering, resting, chilling, etc.
4. Each step MUST list the ingredients used in that step, with the quantity used in that step.
5. If a step uses no ingredients (e.g., "Preheat oven"), set ingredients to an empty array.
6. The sum of ingredient quantities across all steps should approximately equal the total in the ingredients list.
7. Preserve the original recipe's intent — do not add or remove ingredients or steps.
8. If the content does not contain a recipe, return { "error": "No recipe found in the provided content" }.
9. IMAGE ASSIGNMENT: If a list of available images is provided, assign each image to the most relevant step by setting "imageUrl" on that step. Each image should be used at most once. Only assign an image if it is clearly relevant to a specific step (based on alt text or context). Do not assign images to steps where they don't fit. It's fine to leave most steps without an image.
10. VIDEO TIMESTAMP: If the content is a timestamped video transcript (lines starting with [MM:SS]), assign a "videoTimestamp" (in seconds) to each step indicating where in the video that step is demonstrated. Use the timestamp of the transcript segment that best matches the start of each step. Only include videoTimestamp for steps that clearly correspond to a part of the video.
11. CLASSIFY the recipe with these top-level fields:
   - "mealType": exactly one of breakfast | main | side | soup | salad | dessert | snack | drink | sauce | bread | other. Use "main" for dinner/lunch entrées. Use "bread" for breads, pastries, doughs. Use "other" only if nothing else fits.
   - "cuisine": exactly one of american | british | chinese | european | french | fusion | greek | indian | italian | japanese | korean | mediterranean | mexican | middle-eastern | moroccan | romanian | spanish | thai | turkish | vietnamese | other. Use "fusion" for clearly cross-cultural dishes. Use "other" only if nothing else fits. Prefer the most specific accurate value. Null if genuinely unclassifiable.
   - "cookStyle": exactly one of no-cook | stovetop | oven | grill | slow-cooker | mixed. "no-cook" means no heat at all. "mixed" when both stovetop and oven are essential. Use "slow-cooker" for slow cooker, pressure cooker, or sous vide recipes.
   - "totalTimeMinutes": integer estimate of total active + passive time in minutes, from start to ready-to-eat. Include resting, marinating, and rising time. Null only if completely indeterminable.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "title": "Recipe Title",
  "servings": 4,
  "ingredients": [
    { "name": "ingredient name", "quantity": 500, "unit": "g", "notes": "optional prep notes" }
  ],
  "prepSteps": [
    {
      "instruction": "Step description",
      "ingredients": [
        { "name": "ingredient name", "quantity": 500, "unit": "g" }
      ],
      "imageUrl": "https://example.com/step-photo.jpg",
      "videoTimestamp": 45
    }
  ],
  "cookingSteps": [
    {
      "instruction": "Step description",
      "ingredients": [
        { "name": "ingredient name", "quantity": 500, "unit": "g" }
      ],
      "videoTimestamp": 120
    }
  ],
  "mealType": "main",
  "cuisine": "italian",
  "cookStyle": "stovetop",
  "totalTimeMinutes": 45
}`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ro: "Romanian",
};

function getRecipeParsingPrompt(language = "en"): string {
  const langName = LANGUAGE_NAMES[language] ?? "English";
  return `${RECIPE_PARSING_PROMPT_BASE}
12. LANGUAGE: Output all recipe text (title, ingredient names, step instructions, notes) in ${langName}. Keep "mealType", "cuisine", and "cookStyle" values in the canonical English slugs listed above — do not translate them.`;
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

// Parsing runs in the background with a 300s function budget; long articles
// routinely need more than a minute of generation time.
const GEMINI_PARSE_TIMEOUT_MS = 120_000;

// The parsing prompt instructs Gemini to answer { "error": ... } when the
// content contains no recipe; callers translate this for the user instead of
// treating it as an internal failure.
export class NoRecipeFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoRecipeFoundError";
  }
}

// A safety block or MAX_TOKENS finish yields a response without text;
// surface that as a descriptive error instead of JSON.parse(undefined).
function responseTextOf(
  response: GenerateContentResponse,
  context: string,
): string {
  const text = response.text;
  if (!text) {
    const finishReason = response.candidates?.[0]?.finishReason;
    throw new Error(
      `${context}: Gemini returned no text${finishReason ? ` (finish reason: ${finishReason})` : ""}`,
    );
  }
  return text;
}

function normalizeIngredient(ing: unknown): unknown {
  if (!ing || typeof ing !== "object") return ing;
  const obj = ing as Record<string, unknown>;
  const q = obj.quantity;
  const quantity = typeof q === "number" && Number.isFinite(q) ? q : null;
  if (quantity === null) {
    return { ...obj, quantity: 0, unit: "to taste" };
  }
  return { ...obj, quantity };
}

function normalizeMealType(value: unknown): MealType | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return (MEAL_TYPES as readonly string[]).includes(slug)
    ? (slug as MealType)
    : null;
}

function normalizeCookStyle(value: unknown): CookStyle | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  return (COOK_STYLES as readonly string[]).includes(slug)
    ? (slug as CookStyle)
    : null;
}

function normalizeCuisine(value: unknown): Cuisine | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  return (CUISINES as readonly string[]).includes(slug)
    ? (slug as Cuisine)
    : null;
}

function normalizeTotalTime(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value);
}

function normalizeRecipe(recipe: unknown): ParsedRecipe {
  const r = (Array.isArray(recipe) ? recipe[0] : recipe) as Record<
    string,
    unknown
  >;
  const normalizeStep = (s: unknown) => {
    if (!s || typeof s !== "object") return s;
    const step = s as Record<string, unknown>;
    const ings = Array.isArray(step.ingredients) ? step.ingredients : [];
    return { ...step, ingredients: ings.map(normalizeIngredient) };
  };
  return {
    ...r,
    ingredients: Array.isArray(r.ingredients)
      ? r.ingredients.map(normalizeIngredient)
      : [],
    prepSteps: Array.isArray(r.prepSteps) ? r.prepSteps.map(normalizeStep) : [],
    cookingSteps: Array.isArray(r.cookingSteps)
      ? r.cookingSteps.map(normalizeStep)
      : [],
    mealType: normalizeMealType(r.mealType),
    cuisine: normalizeCuisine(r.cuisine),
    cookStyle: normalizeCookStyle(r.cookStyle),
    totalTimeMinutes: normalizeTotalTime(r.totalTimeMinutes),
  } as ParsedRecipe;
}

export async function parseRecipeContent(
  content: string,
  images?: RecipeImage[],
  language = "en",
): Promise<ParsedRecipe> {
  const ai = getClient();

  let prompt = `Extract the recipe from the following content:\n\n---\n${content}\n---`;

  if (images && images.length > 0) {
    const imageList = images
      .map(
        (img, i) =>
          `${i + 1}. ${img.url}${img.alt ? ` (alt: ${img.alt})` : ""}`,
      )
      .join("\n");
    prompt += `\n\nAvailable images from the source page (assign to the most relevant steps):\n${imageList}`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: getRecipeParsingPrompt(language),
      responseMimeType: "application/json",
      responseSchema: PARSED_RECIPE_SCHEMA,
      abortSignal: AbortSignal.timeout(GEMINI_PARSE_TIMEOUT_MS),
    },
  });

  const responseText = responseTextOf(response, "parseRecipeContent");
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new NoRecipeFoundError(parsed.error);
  }

  return normalizeRecipe(parsed);
}

export async function parseRecipeFromUrl(
  url: string,
  language = "en",
): Promise<{ recipe: ParsedRecipe; images: RecipeImage[] }> {
  const ai = getClient();

  // Gemini's API rejects responseMimeType: application/json when a tool
  // (urlContext) is enabled, so we instruct JSON in the prompt and strip
  // any code fence from the reply before parsing.
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the recipe from this URL: ${url}.

Additionally, include a top-level "images" array with the absolute URLs of recipe-relevant photos that appear on the page (hero image, finished dish, key step photos). Each entry is { "url": "https://...", "alt": "optional alt text" }. Only include URLs that actually appear on the page — do not invent them. Omit the field entirely if you find none.`,
    config: {
      systemInstruction: getRecipeParsingPrompt(language),
      tools: [{ urlContext: {} }],
      abortSignal: AbortSignal.timeout(GEMINI_PARSE_TIMEOUT_MS),
    },
  });

  const responseText = responseTextOf(response, "parseRecipeFromUrl").trim();
  // Gemini often prefaces the JSON with a long "thinking" trace, then
  // appends the recipe inside a ```json ... ``` block — match anywhere in
  // the reply, not just when the fence spans the whole response.
  const fenced = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let parsed;
  try {
    parsed = JSON.parse(fenced ? fenced[1].trim() : responseText);
  } catch {
    // Bot-blocked pages make Gemini reply with prose instead of the recipe.
    throw new Error("parseRecipeFromUrl: Gemini reply was not valid JSON");
  }

  if (parsed.error) {
    throw new NoRecipeFoundError(parsed.error);
  }

  const images = normalizeUrlImages(parsed.images);
  return { recipe: normalizeRecipe(parsed), images };
}

function normalizeUrlImages(raw: unknown): RecipeImage[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: RecipeImage[] = [];
  for (const entry of raw) {
    let url: string | undefined;
    let alt: string | undefined;
    if (typeof entry === "string") {
      url = entry;
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      if (typeof obj.url === "string") url = obj.url;
      if (typeof obj.alt === "string") alt = obj.alt;
    }
    if (!url || seen.has(url)) continue;
    try {
      new URL(url);
    } catch {
      continue;
    }
    seen.add(url);
    out.push(alt ? { url, alt } : { url });
  }
  return out;
}

export async function parseRecipeFromYoutube(
  url: string,
  language = "en",
): Promise<ParsedRecipe> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: url, mimeType: "video/*" } },
          {
            text: "Extract the recipe from this video. For each step, assign a videoTimestamp (in seconds) marking where in the video the step is demonstrated.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: getRecipeParsingPrompt(language),
      responseMimeType: "application/json",
      responseSchema: PARSED_RECIPE_SCHEMA,
      abortSignal: AbortSignal.timeout(GEMINI_PARSE_TIMEOUT_MS),
    },
  });

  const responseText = responseTextOf(response, "parseRecipeFromYoutube");
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new NoRecipeFoundError(parsed.error);
  }

  return normalizeRecipe(parsed);
}

export async function parseRecipeFromImage(
  imageBytes: Buffer,
  mimeType: string,
  language?: string,
): Promise<ParsedRecipe>;
export async function parseRecipeFromImage(
  images: { bytes: Buffer; mimeType: string }[],
  language?: string,
): Promise<ParsedRecipe>;
export async function parseRecipeFromImage(
  bytesOrImages: Buffer | { bytes: Buffer; mimeType: string }[],
  mimeTypeOrLanguage?: string,
  language?: string,
): Promise<ParsedRecipe> {
  let images: { bytes: Buffer; mimeType: string }[];
  let lang: string;

  if (Array.isArray(bytesOrImages)) {
    images = bytesOrImages;
    lang = mimeTypeOrLanguage ?? "en";
  } else {
    images = [{ bytes: bytesOrImages, mimeType: mimeTypeOrLanguage! }];
    lang = language ?? "en";
  }

  const ai = getClient();

  const imageParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.bytes.toString("base64"),
    },
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          ...imageParts,
          {
            text:
              images.length > 1
                ? "Extract the recipe shown across these images. The images may be photos of cookbook pages, handwritten recipes, screenshots, or printed recipes. Combine the information from all images into a single recipe."
                : "Extract the recipe shown in this image. The image may be a photo of a cookbook page, handwritten recipe, screenshot, or printed recipe.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: getRecipeParsingPrompt(lang),
      responseMimeType: "application/json",
      responseSchema: PARSED_RECIPE_SCHEMA,
    },
  });

  const responseText = responseTextOf(response, "parseRecipeFromImage");
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new NoRecipeFoundError(parsed.error);
  }

  return normalizeRecipe(parsed);
}

export async function generateRecipeHeroImage(
  recipe: ParsedRecipe,
): Promise<{ bytes: Buffer; mimeType: string }> {
  const ai = getClient();

  const topIngredients = recipe.ingredients
    .slice(0, 6)
    .map((i) => i.name)
    .join(", ");

  const prompt = `Photorealistic overhead food photography of "${recipe.title}", plated and ready to eat. Key ingredients visible: ${topIngredients}. Natural daylight, shallow depth of field, on a rustic wooden table with subtle props. Appetizing, magazine-quality. No text, no watermarks, no hands.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data && inline.mimeType?.startsWith("image/")) {
      return {
        bytes: Buffer.from(inline.data, "base64"),
        mimeType: inline.mimeType,
      };
    }
  }

  throw new Error("Image generation returned no image data");
}

const RECIPE_EDIT_PLANNER_PROMPT_BASE = `You are a recipe refinement assistant. You receive a recipe as JSON and a user request. Your job is to produce a precise list of operations that transform the recipe to match the request.

Return a JSON object with this exact shape:
{
  "summary": "one-sentence summary of the overall change",
  "operations": [ /* array of operation objects, each matching one of the schemas below */ ]
}

EVERY operation object MUST include the "op" field set to one of the type names below, plus the fields listed for that type, plus a "rationale" string. Do not return empty operation objects.

Valid units: g, kg, ml, l, tsp, tbsp, piece, pinch, to taste
Step sections: "prepSteps" or "cookingSteps"
Step indexes are 0-based.

Operation schemas (each shows ALL required fields):
- { "op": "set_title", "title": string, "rationale": string }
- { "op": "set_servings", "servings": number, "scaleIngredients": boolean, "rationale": string }
- { "op": "scale", "factor": number, "rationale": string }  — for "double the recipe", "halve quantities" etc. without changing servings
- { "op": "add_ingredient", "ingredient": { "name": string, "quantity": number, "unit": string, "notes"?: string }, "position"?: number, "rationale": string }
- { "op": "remove_ingredient", "name": string, "rationale": string }  — name must match exactly from the ingredients list
- { "op": "update_ingredient", "name": string, "changes": { "quantity"?: number, "unit"?: string, "notes"?: string }, "rationale": string }
- { "op": "replace_ingredient", "from": string, "to": { "name": string, "quantity": number, "unit": string, "notes"?: string }, "rationale": string }  — also propagates to step ingredient lists
- { "op": "add_step", "section": string, "step": { "instruction": string, "ingredients": [] }, "position"?: number, "rationale": string }
- { "op": "remove_step", "section": string, "index": number, "rationale": string }
- { "op": "update_step", "section": string, "index": number, "changes": { "instruction"?: string, "ingredients"?: array }, "rationale": string }
- { "op": "move_step", "from": { "section": string, "index": number }, "to": { "section": string, "index": number }, "rationale": string }

Rules:
1. Use the MINIMUM set of operations to satisfy the request, but DO emit operations — never return an empty operations array if the user asked for a change.
2. When replacing an ingredient, also emit update_step ops to reword any instructions that name the old ingredient.
3. Keep all quantities metric. If the user specifies non-metric, convert.
4. Emit set_title if and only if the core subject of the recipe changes (e.g. swapping the protein).
5. Preserve imageUrl and videoTimestamp — do not emit ops that would overwrite them unless the step itself is being removed.
6. The "rationale" field is a short human-readable phrase, not a sentence.`;

function getRecipeEditPlannerPrompt(language = "en"): string {
  const langName = LANGUAGE_NAMES[language] ?? "English";
  return `${RECIPE_EDIT_PLANNER_PROMPT_BASE}
7. LANGUAGE: Write the "summary" and all step "instruction" text in ${langName}. Ingredient names should match the recipe's existing language.`;
}

function getSuggestSystemInstruction(
  recipeContext: string,
  language = "en",
): string {
  const langName = LANGUAGE_NAMES[language] ?? "English";
  return `You are a recipe suggestion assistant. The user wants ideas for what to cook. You have access to Google Search to find real recipes with URLs.

The user's saved recipes and cooking history:
${recipeContext}

Structure your response in THREE sections, using these exact headers (do not translate the headers):

## From your collection
Suggest recipes from the user's saved recipes list above that match what they're asking for. If none match, say so briefly.

## From the web
Search for and suggest real recipes with URLs. Include a brief description and the source link for each.

## My own ideas
Suggest 1-2 original recipe ideas you come up with yourself — brief description and key ingredients, no URL needed.

Guidelines:
- Keep each section concise (2-3 items max per section)
- Reference their cooking history when relevant
- Always include real URLs for the "From the web" section
- For "From your collection", mention the recipe title exactly as it appears in their list
- Write all descriptions and content in ${langName}`;
}

// Future improvement: two-stage intent classification before planRecipeEdit.
// For vague requests like "make it healthier" or "make it more summer-y", a first
// LLM call could interpret the intent and rewrite it as a concrete list of changes
// (e.g. "swap butter for olive oil, reduce sugar by 20%"). The rewritten message is
// then passed to planRecipeEdit as normal. This avoids hallucinated operations when
// the model tries to satisfy an abstract goal in one shot.
export async function planRecipeEdit(
  recipe: ParsedRecipe,
  message: string,
  history: Array<{ role: "user" | "model"; content: string }>,
  language = "en",
): Promise<{ operations: Operation[]; summary: string }> {
  const ai = getClient();

  const recipeContext = `Current recipe:\n${JSON.stringify(recipe, null, 2)}`;

  const contents = [
    { role: "user" as const, parts: [{ text: recipeContext }] },
    {
      role: "model" as const,
      parts: [
        { text: "Understood. I have the recipe. What changes would you like?" },
      ],
    },
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: getRecipeEditPlannerPrompt(language),
      responseMimeType: "application/json",
    },
  });

  const parsed = JSON.parse(responseTextOf(response, "planRecipeEdit"));
  return {
    operations: parsed.operations as Operation[],
    summary: parsed.summary as string,
  };
}

export async function suggestRecipes(
  message: string,
  conversationHistory: Array<{ role: "user" | "model"; content: string }>,
  recipeContext: string,
  language = "en",
): Promise<{ text: string; sources: Array<{ uri: string; title: string }> }> {
  const ai = getClient();

  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: getSuggestSystemInstruction(recipeContext, language),
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? "";
  const sources: Array<{ uri: string; title: string }> = [];

  const metadata = response.candidates?.[0]?.groundingMetadata;
  if (metadata?.groundingChunks) {
    for (const chunk of metadata.groundingChunks) {
      if (chunk.web) {
        sources.push({ uri: chunk.web.uri!, title: chunk.web.title ?? "" });
      }
    }
  }

  return { text, sources };
}

export async function suggestRecipesStream(
  message: string,
  conversationHistory: Array<{ role: "user" | "model"; content: string }>,
  recipeContext: string,
  language = "en",
): Promise<ReadableStream<Uint8Array>> {
  const ai = getClient();
  const encoder = new TextEncoder();

  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: getSuggestSystemInstruction(recipeContext, language),
      tools: [{ googleSearch: {} }],
    },
  });

  return new ReadableStream({
    async start(controller) {
      let lastCandidate = null;
      for await (const chunk of response) {
        const text = chunk.text ?? "";
        if (text) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", text })}\n\n`,
            ),
          );
        }
        lastCandidate = chunk.candidates?.[0] ?? lastCandidate;
      }

      const sources: Array<{ uri: string; title: string }> = [];
      const supports: Array<{
        startIndex: number;
        endIndex: number;
        chunkIndices: number[];
      }> = [];
      const metadata = lastCandidate?.groundingMetadata;
      if (metadata?.groundingChunks) {
        for (const grChunk of metadata.groundingChunks) {
          if (grChunk.web) {
            sources.push({
              uri: grChunk.web.uri!,
              title: grChunk.web.title ?? "",
            });
          }
        }
      }
      if (metadata?.groundingSupports) {
        for (const support of metadata.groundingSupports) {
          const seg = support.segment;
          if (
            seg &&
            typeof seg.startIndex === "number" &&
            typeof seg.endIndex === "number"
          ) {
            supports.push({
              startIndex: seg.startIndex,
              endIndex: seg.endIndex,
              chunkIndices: support.groundingChunkIndices ?? [],
            });
          }
        }
      }
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "done", sources, supports })}\n\n`,
        ),
      );
      controller.close();
    },
  });
}

export async function generateRecipe(
  description: string,
  language = "en",
): Promise<ParsedRecipe> {
  const ai = getClient();

  const prompt = `Create a detailed recipe for: ${description}

Be specific with quantities, timings, and techniques. This should be a complete, cookable recipe.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: getRecipeParsingPrompt(language),
      responseMimeType: "application/json",
      responseSchema: PARSED_RECIPE_SCHEMA,
    },
  });

  const responseText = responseTextOf(response, "generateRecipe");
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new NoRecipeFoundError(parsed.error);
  }

  return normalizeRecipe(parsed);
}
