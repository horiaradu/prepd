import * as cheerio from "cheerio";
import * as Sentry from "@sentry/nextjs";
import type { RecipeImage } from "@/types/recipe";

export class ScrapeError extends Error {
  readonly tier: "direct" | "scraperapi";
  readonly status?: number;
  // HTTP status of the failed direct fetch, when this error comes from the
  // ScraperAPI fallback — distinguishes bot blocks (403) from timeouts.
  readonly directStatus?: number;

  constructor(
    message: string,
    opts: {
      tier: "direct" | "scraperapi";
      status?: number;
      directStatus?: number;
      cause?: unknown;
    },
  ) {
    super(message, { cause: opts.cause });
    this.name = "ScrapeError";
    this.tier = opts.tier;
    this.status = opts.status;
    this.directStatus = opts.directStatus;
  }
}

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
// ScraperAPI's recommended client timeout; parsing runs in the background,
// so the full window fits comfortably inside the route's maxDuration.
const SCRAPER_API_TIMEOUT_MS = 70_000;

async function fetchHtmlDirect(
  url: string,
): Promise<{ html: string; finalUrl: string }> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(DIRECT_FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    throw new ScrapeError(
      `Direct fetch failed: ${err instanceof Error ? err.name : "unknown error"}`,
      { tier: "direct", cause: err },
    );
  }

  if (!response.ok) {
    throw new ScrapeError(`Direct fetch failed: HTTP ${response.status}`, {
      tier: "direct",
      status: response.status,
    });
  }

  // response.url is the final URL after redirects — the correct base for
  // resolving relative image paths.
  return { html: await response.text(), finalUrl: response.url || url };
}

// Fetches the page through ScraperAPI, which handles proxy rotation and
// anti-bot protections (Cloudflare, DataDome, ...) automatically. Only
// successful responses consume credits.
async function fetchHtmlViaScraperApi(url: string): Promise<string> {
  const apiKey = process.env.SCRAPERAPI_API_KEY;
  if (!apiKey) {
    throw new ScrapeError("SCRAPERAPI_API_KEY is not configured", {
      tier: "scraperapi",
    });
  }

  const apiUrl = new URL("https://api.scraperapi.com/");
  apiUrl.searchParams.set("api_key", apiKey);
  apiUrl.searchParams.set("url", url);

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(SCRAPER_API_TIMEOUT_MS),
    });
  } catch (err) {
    throw new ScrapeError(
      `ScraperAPI request failed: ${err instanceof Error ? err.name : "unknown error"}`,
      { tier: "scraperapi", cause: err },
    );
  }

  if (!response.ok) {
    throw new ScrapeError(
      `ScraperAPI request failed: HTTP ${response.status}`,
      { tier: "scraperapi", status: response.status },
    );
  }

  return response.text();
}

export async function extractWebPage(url: string): Promise<WebPageExtraction> {
  let html: string;
  let baseUrl = url;

  try {
    ({ html, finalUrl: baseUrl } = await fetchHtmlDirect(url));
  } catch (directErr) {
    const directStatus =
      directErr instanceof ScrapeError ? directErr.status : undefined;
    console.error(
      `Direct fetch failed for ${url}, retrying via ScraperAPI:`,
      directErr,
    );

    try {
      html = await fetchHtmlViaScraperApi(url);
    } catch (apiErr) {
      const apiScrapeErr =
        apiErr instanceof ScrapeError
          ? apiErr
          : new ScrapeError("ScraperAPI request failed", {
              tier: "scraperapi",
              cause: apiErr,
            });
      throw new ScrapeError(
        `Both direct fetch and ScraperAPI failed: ${apiScrapeErr.message}`,
        {
          tier: "scraperapi",
          status: apiScrapeErr.status,
          directStatus,
          cause: apiErr,
        },
      );
    }

    // Successful rescue — counted in Sentry to size ScraperAPI credit usage.
    Sentry.captureMessage("ScraperAPI rescued a blocked fetch", {
      level: "info",
      tags: {
        sourceHost: new URL(url).hostname,
        ...(directStatus ? { directHttpStatus: String(directStatus) } : {}),
      },
    });
  }

  const $ = cheerio.load(html);

  const jsonLd = findJsonLdRecipe($);
  if (jsonLd) {
    return {
      content: JSON.stringify(jsonLd, null, 2),
      images: extractJsonLdImages(jsonLd, $, baseUrl),
    };
  }

  return {
    content: extractArticleText($),
    images: extractPageImages($, baseUrl),
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
  const ogImageCount = images.length;

  // Then images from recipe/article content area; stop at the first
  // selector that yields content images beyond the og:image.
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
    if (images.length > ogImageCount) break;
  }

  return images.slice(0, 5);
}
