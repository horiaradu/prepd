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

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const DIRECT_FETCH_TIMEOUT_MS = 8_000;
// ScraperAPI recommends a 70s client timeout, but the parse route's
// maxDuration is 60s and Gemini still needs to run after the fetch.
const SCRAPER_API_TIMEOUT_MS = 35_000;

async function resolveRedirects(url: string): Promise<string> {
  let current = url;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, {
      method: "HEAD",
      headers: BROWSER_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(DIRECT_FETCH_TIMEOUT_MS),
    });
    const location = res.headers.get("location");
    if (location && res.status >= 300 && res.status < 400) {
      current = new URL(location, current).href;
    } else {
      break;
    }
  }
  return current;
}

async function fetchHtmlDirect(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(DIRECT_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  return response.text();
}

// Fetches the page through ScraperAPI, which handles proxy rotation and
// anti-bot protections (Cloudflare, DataDome, ...) automatically. Only
// successful responses consume credits.
async function fetchHtmlViaScraperApi(url: string): Promise<string> {
  const apiKey = process.env.SCRAPERAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SCRAPERAPI_API_KEY is not configured");
  }

  const apiUrl = new URL("https://api.scraperapi.com/");
  apiUrl.searchParams.set("api_key", apiKey);
  apiUrl.searchParams.set("url", url);

  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(SCRAPER_API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`ScraperAPI request failed: ${response.status}`);
  }

  return response.text();
}

export async function extractWebPage(url: string): Promise<WebPageExtraction> {
  let resolvedUrl: string;
  try {
    resolvedUrl = await resolveRedirects(url);
  } catch {
    // Redirect probing is best-effort; a blocked or slow HEAD request must
    // not fail the extraction.
    resolvedUrl = url;
  }

  let html: string;
  try {
    html = await fetchHtmlDirect(resolvedUrl);
  } catch (err) {
    console.error(
      `Direct fetch failed for ${resolvedUrl}, retrying via ScraperAPI:`,
      err,
    );
    html = await fetchHtmlViaScraperApi(resolvedUrl);
  }

  const $ = cheerio.load(html);

  const jsonLd = findJsonLdRecipe($);
  if (jsonLd) {
    return {
      content: JSON.stringify(jsonLd, null, 2),
      images: extractJsonLdImages(jsonLd, $, resolvedUrl),
    };
  }

  return {
    content: extractArticleText($),
    images: extractPageImages($, resolvedUrl),
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
