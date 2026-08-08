import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { del, put } from "@vercel/blob";
import { generateRecipeHeroImage } from "@/lib/gemini";
import type { ParsedRecipe, RecipeImage, Step } from "@/types/recipe";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

const DOWNLOAD_TIMEOUT_MS = 8_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const declaredLength = Number(response.headers.get("content-length"));
    if (declaredLength > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
    return bytes;
  } catch {
    return null;
  }
}

// Recipe display images live in a separate PUBLIC Blob store (the default
// store is private and rejects public uploads). Connecting the store to the
// project injects PUBLIC_BLOB_STORE_ID; on Vercel the SDK authenticates to
// it with the ambient OIDC token. A read-write token, when present, is an
// explicit override.
function publicBlobAuth(): { token?: string; storeId?: string } {
  const token = process.env.PUBLIC_BLOB_READ_WRITE_TOKEN;
  if (token) return { token };
  const storeId = process.env.PUBLIC_BLOB_STORE_ID;
  if (storeId) return { storeId };
  throw new Error(
    "Public Blob store is not configured (PUBLIC_BLOB_STORE_ID or PUBLIC_BLOB_READ_WRITE_TOKEN)",
  );
}

function isPublicBlobUrl(url: string): boolean {
  return url.includes(".public.blob.vercel-storage.com");
}

// Best-effort cleanup for a stored recipe image in either store; orphaned
// blobs are harmless, so failures are swallowed.
export async function deleteStoredImage(url: string): Promise<void> {
  try {
    await del(url, isPublicBlobUrl(url) ? publicBlobAuth() : undefined);
  } catch {
    // ignore
  }
}

// Resizes, re-encodes as JPEG, and uploads to a public Blob. Public Blob
// URLs are long random strings served from the CDN; recipes reference them
// directly, with no proxy round-trip.
export async function processAndStoreImage(args: {
  userId: string;
  recipeId: string;
  bytes: Buffer;
  suffix: string;
  watermark?: boolean;
}): Promise<string> {
  const { userId, recipeId, bytes, suffix, watermark = false } = args;

  const base = sharp(bytes).resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: true,
  });

  let pipeline = base;
  if (watermark) {
    const meta = await base.metadata();
    const width = meta.width ?? 1600;
    const watermarkWidth = Math.max(140, Math.round(width * 0.2));
    const overlay = await loadWatermark(watermarkWidth);
    pipeline = base.composite([{ input: overlay, gravity: "southeast" }]);
  }

  const resized = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

  const upload = await put(
    `recipes/${userId}/${recipeId}-${Date.now()}-${suffix}.jpg`,
    resized,
    { access: "public", contentType: "image/jpeg", ...publicBlobAuth() },
  );
  return upload.url;
}

export interface PersistRecipeImagesResult {
  images: RecipeImage[];
  prepSteps: Step[];
  cookingSteps: Step[];
}

// Downloads every origin image the recipe references, stores them as public
// Blobs, and rewrites the references (hero list + per-step photos) to the
// stored copies so recipes never depend on hot-linked origin URLs. Images
// that fail to download are dropped. If nothing survives, optionally
// generates an AI hero image.
export async function persistRecipeImages(args: {
  userId: string;
  recipeId: string;
  recipe: ParsedRecipe;
  images: RecipeImage[];
  generateFallbackHero: boolean;
}): Promise<PersistRecipeImagesResult> {
  const { userId, recipeId, recipe, images, generateFallbackHero } = args;

  const stepUrls = [...recipe.prepSteps, ...recipe.cookingSteps]
    .map((s) => s.imageUrl)
    .filter((u): u is string => !!u);
  const originUrls = [
    ...new Set(
      [...images.map((img) => img.url), ...stepUrls].filter((u) =>
        u.startsWith("http"),
      ),
    ),
  ];

  const stored = new Map<string, string>();
  await Promise.all(
    originUrls.map(async (originUrl, i) => {
      const bytes = await downloadImage(originUrl);
      if (!bytes) return;
      try {
        const storedUrl = await processAndStoreImage({
          userId,
          recipeId,
          bytes,
          suffix: `img${i}`,
        });
        stored.set(originUrl, storedUrl);
      } catch (err) {
        console.error(`Failed to store image ${originUrl}:`, err);
      }
    }),
  );

  const remapStep = (step: Step): Step => {
    if (!step.imageUrl) return step;
    const storedUrl = stored.get(step.imageUrl);
    if (storedUrl) return { ...step, imageUrl: storedUrl };
    const rest = { ...step };
    delete rest.imageUrl;
    return rest;
  };

  let persisted: RecipeImage[] = images
    .filter((img) => stored.has(img.url))
    .map((img) => ({
      url: stored.get(img.url)!,
      blobUrl: stored.get(img.url)!,
      ...(img.alt ? { alt: img.alt } : {}),
    }));

  if (persisted.length === 0 && generateFallbackHero) {
    const { image } = await generateAndStoreHeroImage({
      userId,
      recipeId,
      recipe,
    });
    persisted = [image];
  }

  return {
    images: persisted,
    prepSteps: recipe.prepSteps.map(remapStep),
    cookingSteps: recipe.cookingSteps.map(remapStep),
  };
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
}

export async function generateAndStoreHeroImage(
  args: GenerateAndStoreHeroImageArgs,
): Promise<GenerateAndStoreHeroImageResult> {
  const { userId, recipeId, recipe } = args;

  const { bytes } = await generateRecipeHeroImage(recipe);
  const url = await processAndStoreImage({
    userId,
    recipeId,
    bytes,
    suffix: "generated",
    watermark: true,
  });

  return { image: { url, blobUrl: url, alt: recipe.title } };
}
