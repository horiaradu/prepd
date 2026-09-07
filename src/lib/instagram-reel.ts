import type { Reel } from "@/lib/reel";

// Instagram serves anonymous requests nothing but an app shell, so reel data
// comes from Apify's maintained scraper, run synchronously: one POST that
// blocks until the scrape finishes and returns the dataset items.
const ACTOR_ID = "apify~instagram-reel-scraper";
const RUN_TIMEOUT_S = 120;

interface ApifyReelItem {
  caption?: unknown;
  videoUrl?: unknown;
  displayUrl?: unknown;
}

// Strips tracking parameters and the optional /{user}/ prefix so the scraper
// receives the plain reel URL. Share links have no shortcode and pass
// through unchanged.
function canonicalReelUrl(raw: string): string {
  const match = new URL(raw).pathname.match(
    /^(?:\/[^/]+)?\/(reels?|p)\/([A-Za-z0-9_-]+)/,
  );
  if (!match) return raw;
  const kind = match[1] === "p" ? "p" : "reel";
  return `https://www.instagram.com/${kind}/${match[2]}/`;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function resolveInstagramReel(url: string): Promise<Reel> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const endpoint = new URL(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`,
  );
  endpoint.searchParams.set("timeout", String(RUN_TIMEOUT_S));

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: [canonicalReelUrl(url)],
        resultsLimit: 1,
      }),
      signal: AbortSignal.timeout((RUN_TIMEOUT_S + 15) * 1000),
    });
  } catch (err) {
    throw new Error(
      `Apify request failed: ${err instanceof Error ? err.name : "unknown error"}`,
      { cause: err },
    );
  }
  if (!response.ok) {
    throw new Error(`Apify request failed: HTTP ${response.status}`);
  }

  const items = (await response.json()) as unknown;
  const item = Array.isArray(items)
    ? (items[0] as ApifyReelItem | undefined)
    : undefined;
  if (!item) {
    throw new Error("Apify returned no data for the reel");
  }

  return {
    caption: stringOrNull(item.caption),
    videoUrl: stringOrNull(item.videoUrl),
    thumbnailUrl: stringOrNull(item.displayUrl),
  };
}
