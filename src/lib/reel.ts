import { isFetchableUrl } from "@/lib/url-guard";
import { resolveFacebookReel } from "@/lib/facebook-reel";
import { resolveInstagramReel } from "@/lib/instagram-reel";

export type ReelSource = "instagram" | "facebook";

// What a reel page yields before any recipe extraction: the creator's caption
// (often the full recipe), the playable video, and its cover image.
export interface Reel {
  caption: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export interface ReelVideo {
  bytes: Buffer;
  mimeType: string;
}

const VIDEO_DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

// Recognizes reel and video links on Instagram and Facebook, including the
// opaque share links both apps produce (resolved later via their redirect).
export function detectReelSource(raw: string): ReelSource | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (hostMatches(host, "instagram.com")) {
    // /reel/{code}, /reels/{code}, /p/{code}, /{user}/reel/{code},
    // /share/reel/{token}, /share/p/{token}
    return /^(?:\/[^/]+)?\/(?:reels?|p|share\/(?:reel|p))\/[A-Za-z0-9_-]+/.test(
      path,
    )
      ? "instagram"
      : null;
  }

  if (hostMatches(host, "fb.watch")) return "facebook";

  if (hostMatches(host, "facebook.com")) {
    // /reel/{id}, /share/r/{token}, /share/v/{token}
    if (/^\/(?:reel|share\/[rv])\/[^/]+/.test(path)) return "facebook";
    // /watch/?v={id}
    if (path.startsWith("/watch") && url.searchParams.has("v"))
      return "facebook";
    // /{page}/videos/{slug}/{id}/ or /{page}/videos/{id}/
    if (/\/videos\/(?:[^/]+\/)?\d+/.test(path)) return "facebook";
  }

  return null;
}

export function resolveReel(url: string, source: ReelSource): Promise<Reel> {
  return source === "instagram"
    ? resolveInstagramReel(url)
    : resolveFacebookReel(url);
}

// Fetches the reel's video file for upload to Gemini. Reel CDN URLs are
// signed and short-lived, so this runs right after resolving the reel.
export async function downloadReelVideo(url: string): Promise<ReelVideo> {
  // The URL comes from a third-party page or API — same SSRF surface as
  // scraped image URLs.
  if (!isFetchableUrl(url)) {
    throw new Error("Reel video URL is not fetchable");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(VIDEO_DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Reel video download failed: HTTP ${response.status}`);
  }

  const mimeType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim();
  if (!mimeType.startsWith("video/")) {
    throw new Error(`Reel video has unexpected content type "${mimeType}"`);
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (declaredLength > MAX_VIDEO_BYTES) {
    throw new Error("Reel video exceeds the size limit");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_VIDEO_BYTES) {
    throw new Error("Reel video is empty or exceeds the size limit");
  }

  return { bytes, mimeType };
}
