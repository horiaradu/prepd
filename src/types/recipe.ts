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

export const SOURCE_TYPES = ["youtube", "web", "image"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const MEAL_TYPES = [
  "breakfast",
  "main",
  "side",
  "soup",
  "salad",
  "dessert",
  "snack",
  "drink",
  "sauce",
  "bread",
  "other",
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const COOK_STYLES = [
  "no-cook",
  "stovetop",
  "oven",
  "grill",
  "slow-cooker",
  "mixed",
] as const;
export type CookStyle = (typeof COOK_STYLES)[number];

export const CUISINES = [
  "american",
  "british",
  "chinese",
  "european",
  "french",
  "fusion",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "mediterranean",
  "mexican",
  "middle-eastern",
  "moroccan",
  "romanian",
  "spanish",
  "thai",
  "turkish",
  "vietnamese",
  "other",
] as const;
export type Cuisine = (typeof CUISINES)[number];

// Buckets for total cooking time. Edges are inclusive on the low end.
export const TIME_BUCKETS = [
  "under-30",
  "30-60",
  "60-120",
  "over-120",
] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

export function timeBucketFor(minutes: number | null): TimeBucket | null {
  if (minutes == null) return null;
  if (minutes < 30) return "under-30";
  if (minutes < 60) return "30-60";
  if (minutes < 120) return "60-120";
  return "over-120";
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: Unit;
  notes?: string;
}

export interface Step {
  instruction: string;
  ingredients: Ingredient[];
  imageUrl?: string;
  videoTimestamp?: number;
}

export interface RecipeImage {
  url: string;
  alt?: string;
  // Private Vercel Blob URL. Present when the image is stored in our blob
  // store and must be served through the authenticated proxy.
  blobUrl?: string;
}

export interface RecipeTaxonomy {
  mealType: MealType | null;
  cuisine: Cuisine | null;
  cookStyle: CookStyle | null;
  totalTimeMinutes: number | null;
}

export interface ParsedRecipe extends RecipeTaxonomy {
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
  images: RecipeImage[] | null;
  originalRecipe: ParsedRecipe | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSummary extends RecipeTaxonomy {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: SourceType;
  createdAt: string;
  imageUrl: string | null;
  cookCount: number;
  lastCookedAt: string | null;
}

export interface ParseRequest {
  url: string;
  replaceId?: string;
}

export interface ParseResponse {
  id: string;
  recipe: ParsedRecipe;
  sourceUrl: string;
  sourceType: SourceType;
  imageUrl: string | null;
}
