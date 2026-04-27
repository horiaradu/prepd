import { YoutubeTranscript } from "youtube-transcript";

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

export function extractYoutubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null;
}

export async function extractYoutubeTranscript(url: string): Promise<string> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
  return transcriptItems.map((item) => item.text).join(" ");
}
