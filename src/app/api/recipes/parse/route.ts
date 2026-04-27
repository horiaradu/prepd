import { NextRequest, NextResponse } from "next/server";
import { isYoutubeUrl, extractYoutubeTranscript } from "@/lib/youtube";
import { extractWebPageContent } from "@/lib/scraper";
import { parseRecipeContent } from "@/lib/gemini";
import type { ParseRequest, SourceType } from "@/types/recipe";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ParseRequest;

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 },
      );
    }

    let url: URL;
    try {
      url = new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 },
      );
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(url.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP/HTTPS URLs are supported" },
        { status: 400 },
      );
    }

    const sourceType: SourceType = isYoutubeUrl(body.url) ? "youtube" : "web";

    const content =
      sourceType === "youtube"
        ? await extractYoutubeTranscript(body.url)
        : await extractWebPageContent(body.url);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract content from the URL" },
        { status: 422 },
      );
    }

    const recipe = await parseRecipeContent(content);

    return NextResponse.json({
      recipe,
      sourceUrl: body.url,
      sourceType,
    });
  } catch (error) {
    console.error("Recipe parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse recipe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
