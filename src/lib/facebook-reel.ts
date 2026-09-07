import * as cheerio from "cheerio";
import * as Sentry from "@sentry/nextjs";
import { BROWSER_HEADERS, fetchHtmlViaScraperApi } from "@/lib/scraper";
import type { Reel } from "@/lib/reel";

// Facebook answers HTTP 400 to requests missing the fetch-metadata and
// client-hint headers a real browser sends, so the base header set alone is
// not enough here.
const DOCUMENT_HEADERS = {
  ...BROWSER_HEADERS,
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "sec-ch-ua":
    '"Chromium";v="125", "Google Chrome";v="125", "Not.A/Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
};

const FETCH_TIMEOUT_MS = 15_000;

// The public reel page embeds its data as JSON script blocks. The video node
// carries the playable URLs keyed by the reel id; the story node carries the
// creator's caption and references the same id in its attachments.
interface VideoNode {
  id?: unknown;
  browser_native_hd_url?: unknown;
  browser_native_sd_url?: unknown;
}

interface StoryNode {
  message?: { text?: unknown };
}

// The numeric video id from any of Facebook's video URL shapes:
// /reel/{id}, /watch/?v={id}, /{page}/videos/{slug}/{id}/.
function reelIdFrom(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const watchId = url.searchParams.get("v");
  if (watchId && /^\d+$/.test(watchId)) return watchId;
  const match = url.pathname.match(/\/(?:reel|videos(?:\/[^/]+)?)\/(\d+)/);
  return match ? match[1] : null;
}

function collectNodes(
  node: unknown,
  videos: VideoNode[],
  stories: StoryNode[],
): void {
  if (Array.isArray(node)) {
    for (const item of node) collectNodes(item, videos, stories);
    return;
  }
  if (typeof node !== "object" || node === null) return;

  const obj = node as Record<string, unknown>;
  if (
    typeof obj.browser_native_hd_url === "string" ||
    typeof obj.browser_native_sd_url === "string"
  ) {
    videos.push(obj as VideoNode);
  }
  const message = obj.message;
  if (
    typeof message === "object" &&
    message !== null &&
    typeof (message as { text?: unknown }).text === "string"
  ) {
    stories.push(obj as StoryNode);
  }
  for (const value of Object.values(obj)) collectNodes(value, videos, stories);
}

// Returns null when the page holds no reel data — the login wall and the
// bot-challenge shell both look like that.
function extractReel(html: string, knownReelId: string | null): Reel | null {
  const $ = cheerio.load(html);

  const videos: VideoNode[] = [];
  const stories: StoryNode[] = [];
  $('script[type="application/json"]').each((_i, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      collectNodes(JSON.parse(raw), videos, stories);
    } catch {
      // Not JSON, skip
    }
  });

  const ogUrl = $('meta[property="og:url"]').attr("content");
  const reelId = knownReelId ?? (ogUrl ? reelIdFrom(ogUrl) : null);

  // Reel pages also embed the videos suggested next to the reel, so the id
  // decides which node is ours; a page with a single video needs no id.
  const video = reelId
    ? videos.find((v) => v.id === reelId)
    : videos.length === 1
      ? videos[0]
      : undefined;
  if (!video) return null;

  const story = reelId
    ? stories.find((s) => JSON.stringify(s).includes(reelId))
    : stories.length === 1
      ? stories[0]
      : undefined;
  const storyText = story?.message?.text;
  const caption =
    (typeof storyText === "string" ? storyText.trim() : "") ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const videoUrl =
    typeof video.browser_native_hd_url === "string"
      ? video.browser_native_hd_url
      : typeof video.browser_native_sd_url === "string"
        ? video.browser_native_sd_url
        : null;

  return {
    caption,
    videoUrl,
    thumbnailUrl: $('meta[property="og:image"]').attr("content") ?? null,
  };
}

async function fetchDocument(
  url: string,
): Promise<{ html: string; finalUrl: string }> {
  const response = await fetch(url, {
    headers: DOCUMENT_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Facebook fetch failed: HTTP ${response.status}`);
  }
  // Share links and fb.watch redirect to the canonical URL, which carries
  // the reel id.
  return { html: await response.text(), finalUrl: response.url || url };
}

export async function resolveFacebookReel(url: string): Promise<Reel> {
  try {
    const { html, finalUrl } = await fetchDocument(url);
    const reel = extractReel(html, reelIdFrom(finalUrl) ?? reelIdFrom(url));
    if (reel) return reel;
    console.error(`Facebook page for ${url} holds no reel data`);
  } catch (err) {
    console.error(`Facebook direct fetch failed for ${url}:`, err);
    Sentry.captureException(err, {
      tags: { stage: "reel-resolve", provider: "facebook-direct" },
    });
  }

  // Blocked or served the login shell: retry through the anti-bot proxy.
  const html = await fetchHtmlViaScraperApi(url);
  const reel = extractReel(html, reelIdFrom(url));
  if (!reel) {
    throw new Error("Facebook page holds no reel data (via ScraperAPI)");
  }
  return reel;
}
