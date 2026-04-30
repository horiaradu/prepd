import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { generateRecipeHeroImage } from "@/lib/gemini";

let watermarkCache: Buffer | null = null;

async function loadWatermark(targetWidth: number): Promise<Buffer> {
  if (!watermarkCache) {
    const filePath = path.join(process.cwd(), "public", "watermark.png");
    watermarkCache = await fs.readFile(filePath);
  }
  return sharp(watermarkCache)
    .resize({ width: targetWidth, fit: "inside" })
    .toBuffer();
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let blobUrl: string | null = null;
  try {
    const { bytes } = await generateRecipeHeroImage({
      title: row.title,
      servings: row.servings,
      ingredients: row.ingredients,
      prepSteps: row.prepSteps,
      cookingSteps: row.cookingSteps,
    });

    const base = sharp(bytes).resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    });
    const meta = await base.metadata();
    const width = meta.width ?? 1600;

    const watermarkWidth = Math.max(140, Math.round(width * 0.2));
    const watermark = await loadWatermark(watermarkWidth);

    const resized = await base
      .composite([{ input: watermark, gravity: "southeast" }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    const upload = await put(
      `recipes/${userId}/${id}-${Date.now()}-generated.jpg`,
      resized,
      { access: "private", contentType: "image/jpeg" },
    );
    blobUrl = upload.url;

    const previousBlobUrl = row.images?.[0]?.blobUrl;
    const imageUrl = `/api/recipes/${id}/image?v=${Date.now()}`;
    await db
      .update(recipes)
      .set({ images: [{ url: imageUrl, blobUrl, alt: row.title }] })
      .where(eq(recipes.id, id));

    // Don't delete the original uploaded photo; users may want to view or
    // re-parse from it later via the source-image proxy.
    if (previousBlobUrl && previousBlobUrl !== row.sourceUrl) {
      await del(previousBlobUrl).catch(() => {});
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (blobUrl) await del(blobUrl).catch(() => {});
    console.error("Generate image error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
