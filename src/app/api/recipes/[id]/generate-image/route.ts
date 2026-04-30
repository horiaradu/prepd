import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { generateRecipeHeroImage } from "@/lib/gemini";

function buildWatermarkSvg(imageWidth: number, imageHeight: number): string {
  const fontSize = Math.max(
    18,
    Math.round(Math.min(imageWidth, imageHeight) * 0.025),
  );
  const padX = Math.round(fontSize * 0.9);
  const padY = Math.round(fontSize * 0.5);
  const text = "Generated with AI";
  const textWidth = Math.round(text.length * fontSize * 0.55);
  const boxWidth = textWidth + padX * 2;
  const boxHeight = fontSize + padY * 2;
  const margin = Math.round(fontSize * 0.8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boxWidth + margin}" height="${boxHeight + margin}">
  <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" rx="${Math.round(boxHeight / 2)}" ry="${Math.round(boxHeight / 2)}" fill="rgba(0,0,0,0.55)"/>
  <text x="${padX}" y="${padY + fontSize * 0.85}" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="600" fill="white">${text}</text>
</svg>`;
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
    const height = meta.height ?? 1600;

    const watermark = Buffer.from(buildWatermarkSvg(width, height));

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
    const imageUrl = `/api/recipes/${id}/image`;
    await db
      .update(recipes)
      .set({ images: [{ url: imageUrl, blobUrl, alt: row.title }] })
      .where(eq(recipes.id, id));

    // Don't delete the original uploaded photo; users may want to view or
    // re-parse from it later via the source-image proxy.
    if (previousBlobUrl && previousBlobUrl !== row.sourceUrl) {
      await del(previousBlobUrl).catch(() => {});
    }

    // Cache-bust so the <img> reloads even though the URL is unchanged.
    return NextResponse.json({ imageUrl: `${imageUrl}?v=${Date.now()}` });
  } catch (error) {
    if (blobUrl) await del(blobUrl).catch(() => {});
    console.error("Generate image error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
