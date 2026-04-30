import * as cheerio from "cheerio";
import type { RecipeImage } from "@/types/recipe";

interface JsonLdRecipe {
  name?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<string | { text?: string }>;
  image?: unknown;
  [key: string]: unknown;
}

export interface WebPageExtraction {
  content: string;
  images: RecipeImage[];
}

export async function extractWebPage(url: string): Promise<WebPageExtraction> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const jsonLd = findJsonLdRecipe($);
  if (jsonLd) {
    return {
      content: JSON.stringify(jsonLd, null, 2),
      images: extractJsonLdImages(jsonLd, $, url),
    };
  }

  return {
    content: extractArticleText($),
    images: extractPageImages($, url),
  };
}

export async function extractWebPageContent(url: string): Promise<string> {
  const { content } = await extractWebPage(url);
  return content;
}

function findJsonLdRecipe($: cheerio.CheerioAPI): JsonLdRecipe | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html();
      if (!raw) continue;

      const data = JSON.parse(raw);
      const recipe = findRecipeInJsonLd(data);

      if (recipe) {
        return recipe;
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return null;
}

function findRecipeInJsonLd(data: unknown): JsonLdRecipe | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findRecipeInJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    if (
      obj["@type"] === "Recipe" ||
      (Array.isArray(obj["@type"]) && obj["@type"].includes("Recipe"))
    ) {
      return obj as JsonLdRecipe;
    }

    // Check @graph for schema.org structured data
    if (Array.isArray(obj["@graph"])) {
      return findRecipeInJsonLd(obj["@graph"]);
    }
  }

  return null;
}

function extractArticleText($: cheerio.CheerioAPI): string {
  // Remove noise
  $("script, style, nav, header, footer, aside, .ad, .sidebar").remove();

  // Try common recipe/article containers
  const selectors = [
    "article",
    '[itemtype*="Recipe"]',
    ".recipe",
    ".recipe-content",
    "main",
    ".post-content",
    ".entry-content",
  ];

  for (const selector of selectors) {
    const el = $(selector);
    if (el.length > 0) {
      const text = el.first().text().trim();
      if (text.length > 200) {
        return cleanText(text);
      }
    }
  }

  // Last resort: body text
  return cleanText($("body").text());
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 10000); // Cap at 10k chars to stay within LLM context limits
}

function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

function extractJsonLdImages(
  recipe: JsonLdRecipe,
  $: cheerio.CheerioAPI,
  baseUrl: string,
): RecipeImage[] {
  const images: RecipeImage[] = [];
  const seen = new Set<string>();

  const addImage = (url: string, alt?: string) => {
    const resolved = resolveUrl(url, baseUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      images.push({ url: resolved, ...(alt ? { alt } : {}) });
    }
  };

  // JSON-LD image field: string, array of strings, or ImageObject
  if (recipe.image) {
    if (typeof recipe.image === "string") {
      addImage(recipe.image);
    } else if (Array.isArray(recipe.image)) {
      for (const img of recipe.image) {
        if (typeof img === "string") {
          addImage(img);
        } else if (typeof img === "object" && img !== null) {
          const obj = img as Record<string, unknown>;
          if (typeof obj.url === "string") addImage(obj.url);
        }
      }
    } else if (typeof recipe.image === "object") {
      const obj = recipe.image as Record<string, unknown>;
      if (typeof obj.url === "string") addImage(obj.url);
    }
  }

  // Also grab og:image as fallback
  if (images.length === 0) {
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) addImage(ogImage);
  }

  return images;
}

function extractPageImages(
  $: cheerio.CheerioAPI,
  baseUrl: string,
): RecipeImage[] {
  const images: RecipeImage[] = [];
  const seen = new Set<string>();

  const addImage = (url: string, alt?: string) => {
    const resolved = resolveUrl(url, baseUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      images.push({ url: resolved, ...(alt ? { alt } : {}) });
    }
  };

  // og:image first — usually the best hero image
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) addImage(ogImage);

  // Then images from recipe/article content area
  const selectors = [
    "article img",
    '[itemtype*="Recipe"] img',
    ".recipe img",
    "main img",
    ".post-content img",
    ".entry-content img",
  ];

  for (const selector of selectors) {
    $(selector).each((_i, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("data:")) {
        addImage(src, $(el).attr("alt") || undefined);
      }
    });
    if (images.length > 0) break;
  }

  return images.slice(0, 5);
}
