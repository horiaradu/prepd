import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedRecipe } from "@/types/recipe";

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
      ]
    }
  ],
  "cookingSteps": [
    {
      "instruction": "Step description",
      "ingredients": [
        { "name": "ingredient name", "quantity": 500, "unit": "g" }
      ]
    }
  ]
}`;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function parseRecipeContent(
  content: string,
): Promise<ParsedRecipe> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: RECIPE_PARSING_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(
    `Extract the recipe from the following content:\n\n---\n${content}\n---`,
  );

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed as ParsedRecipe;
}
