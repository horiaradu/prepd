import * as cheerio from "cheerio";

interface JsonLdRecipe {
  name?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<string | { text?: string }>;
  [key: string]: unknown;
}

export async function extractWebPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Prepd/1.0; +https://prepd-ten.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Try JSON-LD structured data first — much cleaner than raw HTML
  const jsonLdContent = extractJsonLdRecipe($);
  if (jsonLdContent) {
    return jsonLdContent;
  }

  // Fall back to extracting article text
  return extractArticleText($);
}

function extractJsonLdRecipe($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html();
      if (!raw) continue;

      const data = JSON.parse(raw);
      const recipe = findRecipeInJsonLd(data);

      if (recipe) {
        return JSON.stringify(recipe, null, 2);
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
