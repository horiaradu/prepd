import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getServerSession } from "next-auth";
import { put, get } from "@vercel/blob";
import sharp from "sharp";
import { and, eq, sql } from "drizzle-orm";
import { authOptions, isAdmin } from "@/lib/auth";
import { runImageParse } from "@/lib/parse-image-pipeline";
import { parseAllowance } from "@/lib/parse-limit";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { isValidLocale, LOCALE_COOKIE, getTranslations } from "@/lib/i18n";
import type { RecipeImage } from "@/types/recipe";

export const maxDuration = 300;

async function resizeToJpeg(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function readBlobBytes(blobUrl: string): Promise<Buffer | null> {
  const blob = await get(blobUrl, { access: "private" });
  if (!blob || blob.statusCode !== 200) return null;
  const chunks: Uint8Array[] = [];
  for await (const chunk of blob.stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Photo parsing runs asynchronously, mirroring the URL flow: the uploaded
// photos are stored and the recipe row is created immediately with status
// "parsing"; OCR runs in the background via after() and the client polls.
// A JSON body with { replaceId } re-runs OCR against a recipe's already-
// stored source photos (used by the failed-card retry).
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const rawLocale = request.cookies.get(LOCALE_COOKIE)?.value ?? "en";
  const language = isValidLocale(rawLocale) ? rawLocale : "en";
  const t = getTranslations(language);
  const contentType = request.headers.get("content-type") ?? "";

  // Reparse: re-OCR the recipe's stored source photos.
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { replaceId?: string };
    if (!body.replaceId) {
      return NextResponse.json(
        { error: "replaceId required" },
        { status: 400 },
      );
    }
    const [row] = await db
      .select({
        id: recipes.id,
        status: recipes.status,
        images: recipes.images,
        hasContent: sql<boolean>`jsonb_array_length(${recipes.ingredients}) > 0`,
      })
      .from(recipes)
      .where(and(eq(recipes.id, body.replaceId), eq(recipes.userId, userId)));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (row.status === "parsing") {
      return NextResponse.json(
        { error: "A parse is already running for this recipe" },
        { status: 409 },
      );
    }

    const blobUrls = (row.images ?? [])
      .map((img) => img.blobUrl)
      .filter((u): u is string => !!u);
    const buffers = (
      await Promise.all(blobUrls.map((u) => readBlobBytes(u)))
    ).filter((b): b is Buffer => b !== null);
    if (buffers.length === 0) {
      return NextResponse.json(
        { error: "Source photos are no longer available" },
        { status: 410 },
      );
    }

    await db
      .update(recipes)
      .set({ status: "parsing", parseError: null, updatedAt: new Date() })
      .where(eq(recipes.id, row.id));

    after(() =>
      runImageParse({
        recipeId: row.id,
        userId,
        language,
        images: buffers.map((bytes) => ({ bytes, mimeType: "image/jpeg" })),
        isReparse: row.hasContent,
        detailedErrors: isAdmin(session.user.email),
      }),
    );
    return NextResponse.json(
      { id: row.id, sourceType: "image" },
      { status: 202 },
    );
  }

  // Fresh upload.
  if (!(await parseAllowance(userId))) {
    return NextResponse.json(
      { error: "Too many parses; try again later" },
      { status: 429 },
    );
  }

  let imageFiles: File[];
  try {
    const formData = await request.formData();
    const files = formData.getAll("image");
    imageFiles = files.filter((f): f is File => f instanceof File);
    if (imageFiles.length === 0) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const resizedImages = await Promise.all(
    imageFiles.map(async (file) =>
      resizeToJpeg(Buffer.from(await file.arrayBuffer())),
    ),
  );

  const uploads = await Promise.all(
    resizedImages.map((resized, i) =>
      put(`recipes/${userId}/${Date.now()}-${i}.jpg`, resized, {
        access: "private",
        contentType: "image/jpeg",
      }),
    ),
  );
  const blobUrls = uploads.map((u) => u.url);

  const [saved] = await db
    .insert(recipes)
    .values({
      userId,
      title: t.photoRecipePlaceholder,
      sourceUrl: blobUrls[0],
      sourceType: "image",
      language,
      ingredients: [],
      prepSteps: [],
      cookingSteps: [],
      images: [],
      status: "parsing",
    })
    .returning({ id: recipes.id });

  // Source photos are served through the authenticated proxy; the first is
  // the hero, the rest reference their blobs directly.
  const imageEntries: RecipeImage[] = blobUrls.map((url, i) => ({
    url: i === 0 ? `/api/recipes/${saved.id}/image?v=${Date.now()}` : url,
    blobUrl: url,
  }));
  await db
    .update(recipes)
    .set({ images: imageEntries })
    .where(eq(recipes.id, saved.id));

  after(() =>
    runImageParse({
      recipeId: saved.id,
      userId,
      language,
      images: resizedImages.map((bytes) => ({ bytes, mimeType: "image/jpeg" })),
      isReparse: false,
      detailedErrors: isAdmin(session.user.email),
    }),
  );

  return NextResponse.json(
    { id: saved.id, sourceType: "image" },
    { status: 202 },
  );
}
