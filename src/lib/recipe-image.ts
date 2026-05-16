import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { generateRecipeHeroImage } from "@/lib/gemini";
import type { ParsedRecipe, RecipeImage } from "@/types/recipe";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

const ACCESSIBILITY_TIMEOUT_MS = 4000;

export async function isImageUrlAccessible(url: string): Promise<boolean> {
  // Vercel Blob proxy URLs (served by our own API) are trusted — skip
  // network validation for them.
  if (url.startsWith("/")) return true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACCESSIBILITY_TIMEOUT_MS);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    // Some CDNs reject HEAD; fall back to a ranged GET that pulls just the
    // first byte so we can still confirm the resource exists.
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        headers: { ...BROWSER_HEADERS, Range: "bytes=0-0" },
        redirect: "follow",
        signal: controller.signal,
      });
    }
    if (!response.ok && response.status !== 206) return false;
    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function findFirstWorkingImage(
  images: RecipeImage[],
): Promise<RecipeImage | null> {
  for (const image of images) {
    if (await isImageUrlAccessible(image.url)) return image;
  }
  return null;
}

let watermarkSource: Buffer | null = null;

async function loadWatermark(targetWidth: number): Promise<Buffer> {
  if (!watermarkSource) {
    const filePath = path.join(process.cwd(), "public", "watermark.png");
    watermarkSource = await fs.readFile(filePath);
  }
  return sharp(watermarkSource)
    .resize({ width: targetWidth, fit: "inside" })
    .toBuffer();
}

export interface GenerateAndStoreHeroImageArgs {
  userId: string;
  recipeId: string;
  recipe: ParsedRecipe;
}

export interface GenerateAndStoreHeroImageResult {
  image: RecipeImage;
  proxyUrl: string;
}

export async function generateAndStoreHeroImage(
  args: GenerateAndStoreHeroImageArgs,
): Promise<GenerateAndStoreHeroImageResult> {
  const { userId, recipeId, recipe } = args;

  const { bytes } = await generateRecipeHeroImage(recipe);

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
    `recipes/${userId}/${recipeId}-${Date.now()}-generated.jpg`,
    resized,
    { access: "private", contentType: "image/jpeg" },
  );

  const proxyUrl = `/api/recipes/${recipeId}/image?v=${Date.now()}`;
  return {
    image: { url: proxyUrl, blobUrl: upload.url, alt: recipe.title },
    proxyUrl,
  };
}
