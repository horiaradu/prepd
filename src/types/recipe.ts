export const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "piece",
  "pinch",
  "to taste",
] as const;
export type Unit = (typeof UNITS)[number];

export const SOURCE_TYPES = ["youtube", "web"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export interface Ingredient {
  name: string;
  quantity: number;
  unit: Unit;
  notes?: string;
}

export interface Step {
  instruction: string;
  ingredients: Ingredient[];
}

export interface ParsedRecipe {
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  prepSteps: Step[];
  cookingSteps: Step[];
}

export interface Recipe extends ParsedRecipe {
  id: string;
  sourceUrl: string;
  sourceType: SourceType;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: SourceType;
  createdAt: string;
}

export interface ParseRequest {
  url: string;
}

export interface ParseResponse {
  recipe: ParsedRecipe;
  sourceUrl: string;
  sourceType: SourceType;
}
