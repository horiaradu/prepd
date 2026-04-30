import { GoogleGenAI } from "@google/genai";
import type { ParsedRecipe, RecipeImage } from "@/types/recipe";

const RECIPE_PARSING_PROMPT = `You are a recipe extraction assistant. Your job is to take raw recipe content (from a webpage or video transcript) and return a clean, structured recipe.

Rules:
1. Convert ALL quantities to the metric system (grams, kilograms, milliliters, liters). Convert Fahrenheit to Celsius.
2. Use these units only: g, kg, ml, l, tsp, tbsp, piece, pinch, to taste
   - Keep tsp and tbsp as-is (they are practical for small quantities)
   - Convert cups, ounces, pounds, quarts, etc. to metric equivalents
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
  ]
}`;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export async function parseRecipeContent(
  content: string,
  images?: RecipeImage[],
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
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: RECIPE_PARSING_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text!;
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed as ParsedRecipe;
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Extract the recipe from this URL: ${url}`,
    config: {
      systemInstruction: RECIPE_PARSING_PROMPT,
      responseMimeType: "application/json",
      tools: [{ urlContext: {} }],
    },
  });

  const responseText = response.text!;
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed as ParsedRecipe;
}

const RECIPE_UPDATE_PROMPT = `You are a recipe refinement assistant. You receive a structured recipe as JSON and a user message describing changes they want. Apply the requested changes to the recipe and return the updated JSON.

Rules:
1. Preserve all fields and structure exactly as received, only modifying what the user asks for.
2. Keep all quantities in the metric system. If the user specifies non-metric, convert to metric.
3. Use these units only: g, kg, ml, l, tsp, tbsp, piece, pinch, to taste
4. Maintain the separation between prepSteps and cookingSteps.
5. Keep ingredient quantities in each step consistent with the total ingredients list.
6. Preserve imageUrl and videoTimestamp on steps unless the step is being removed or fundamentally changed.
7. Return ONLY valid JSON matching the exact same structure as the input. No markdown, no explanation.
8. Also return a brief summary of what you changed as a separate "summary" field (one sentence).

Return JSON with this structure:
{
  "recipe": { ... the full updated recipe ... },
  "summary": "Changed garlic from 2 to 4 cloves and added a toasting step."
}`;

export async function updateRecipe(
  recipe: ParsedRecipe,
  message: string,
): Promise<{ recipe: ParsedRecipe; summary: string }> {
  const ai = getClient();

  const prompt = `Current recipe:\n\n${JSON.stringify(recipe, null, 2)}\n\nUser message: ${message}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: RECIPE_UPDATE_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text!;
  const parsed = JSON.parse(responseText);

  return {
    recipe: parsed.recipe as ParsedRecipe,
    summary: parsed.summary as string,
  };
}

export async function suggestRecipes(
  message: string,
  conversationHistory: Array<{ role: "user" | "model"; content: string }>,
  recipeContext: string,
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
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: `You are a recipe suggestion assistant. The user wants ideas for what to cook. You have access to Google Search to find real recipes with URLs.

The user's saved recipes and cooking history:
${recipeContext}

Structure your response in THREE sections, using these exact headers:

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
- For "From your collection", mention the recipe title exactly as it appears in their list`,
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
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: `You are a recipe suggestion assistant. The user wants ideas for what to cook. You have access to Google Search to find real recipes with URLs.

The user's saved recipes and cooking history:
${recipeContext}

Structure your response in THREE sections, using these exact headers:

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
- For "From your collection", mention the recipe title exactly as it appears in their list`,
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
): Promise<ParsedRecipe> {
  const ai = getClient();

  const prompt = `Create a detailed recipe for: ${description}

Be specific with quantities, timings, and techniques. This should be a complete, cookable recipe.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: RECIPE_PARSING_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text!;
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed as ParsedRecipe;
}
