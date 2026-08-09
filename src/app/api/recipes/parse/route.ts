import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, sql } from "drizzle-orm";
import { authOptions, isAdmin } from "@/lib/auth";
import { isYoutubeUrl } from "@/lib/youtube";
import { runRecipeParse } from "@/lib/parse-pipeline";
import { isFetchableUrl } from "@/lib/url-guard";
import { parseAllowance } from "@/lib/parse-limit";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { isValidLocale, LOCALE_COOKIE } from "@/lib/i18n";
import type { ParseRequest, SourceType } from "@/types/recipe";

export const maxDuration = 300;

// Accepts the URL, creates (or flags) the recipe row, and returns its id
// immediately. The actual parse — fetch, Gemini, image persistence — runs in
// the background via after(); clients poll the recipe until its status
// leaves "parsing".
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ParseRequest;

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(body.url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!isFetchableUrl(body.url)) {
    return NextResponse.json(
      { error: "URL is not supported" },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const sourceType: SourceType = isYoutubeUrl(body.url) ? "youtube" : "web";
  const rawLocale = request.cookies.get(LOCALE_COOKIE)?.value ?? "en";
  const language = isValidLocale(rawLocale) ? rawLocale : "en";

  let recipeId: string;
  // True only when the row already holds a usable recipe — then a failed
  // reparse keeps it. Retrying a failed (empty) parse behaves like a fresh
  // one.
  let isReparse = false;
  if (body.replaceId) {
    const [existing] = await db
      .select({
        id: recipes.id,
        status: recipes.status,
        hasContent: sql<boolean>`jsonb_array_length(${recipes.ingredients}) > 0`,
      })
      .from(recipes)
      .where(and(eq(recipes.id, body.replaceId), eq(recipes.userId, userId)));
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.status === "parsing") {
      return NextResponse.json(
        { error: "A parse is already running for this recipe" },
        { status: 409 },
      );
    }
    recipeId = existing.id;
    isReparse = existing.hasContent;
    await db
      .update(recipes)
      .set({ status: "parsing", parseError: null, updatedAt: new Date() })
      .where(eq(recipes.id, recipeId));
  } else {
    if (!(await parseAllowance(userId))) {
      return NextResponse.json(
        { error: "Too many parses; try again later" },
        { status: 429 },
      );
    }
    const [saved] = await db
      .insert(recipes)
      .values({
        userId,
        title: url.hostname,
        sourceUrl: body.url,
        sourceType,
        language,
        ingredients: [],
        prepSteps: [],
        cookingSteps: [],
        images: [],
        status: "parsing",
      })
      .returning({ id: recipes.id });
    recipeId = saved.id;
  }

  after(() =>
    runRecipeParse({
      recipeId,
      url: body.url,
      sourceType,
      language,
      userId,
      isReparse,
      detailedErrors: isAdmin(session.user.email),
    }),
  );

  return NextResponse.json({ id: recipeId, sourceType }, { status: 202 });
}
