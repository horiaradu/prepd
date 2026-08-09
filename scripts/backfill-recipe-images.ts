/**
 * One-off backfill: migrate existing recipes' images to the public Blob store
 * so nothing hot-links to origin sites or depends on the authenticated proxy.
 *
 * Per recipe, for the hero and every step photo:
 *   - external origin URL  -> download, store public, rewrite reference
 *   - private-proxy hero    -> read from the private store, store public,
 *                              rewrite reference, delete the old private blob
 *   - already public        -> leave as-is
 *
 * Idempotent and safe: a per-image failure leaves that reference untouched
 * (the old URL keeps working); a recipe is only written when something
 * changed. Dead origins are reported, not regenerated — that's a separate
 * cost decision (reparse the recipe to get a fresh/generated image).
 *
 * Usage:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/backfill-recipe-images.ts          # dry run
 *   npx tsx --env-file=.env --env-file=.env.local scripts/backfill-recipe-images.ts --apply  # write
 */
import { eq } from "drizzle-orm";
import { get, del } from "@vercel/blob";
import { db } from "../src/db/index";
import { recipes } from "../src/db/schema";
import { processAndStoreImage } from "../src/lib/recipe-image";
import type { RecipeImage, Step } from "../src/types/recipe";

const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : Infinity;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

type Kind = "external" | "proxy" | "public" | "other";

function classify(url: string | undefined): Kind {
  if (!url) return "other";
  if (url.includes(".public.blob.vercel-storage.com")) return "public";
  if (url.startsWith("/api/")) return "proxy";
  if (url.includes(".blob.vercel-storage.com")) return "public"; // treat any blob as migrated
  if (url.startsWith("http")) return "external";
  return "other";
}

async function bytesForExternal(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").startsWith("image/"))
      return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function bytesForPrivate(blobUrl: string): Promise<Buffer | null> {
  try {
    const blob = await get(blobUrl, { access: "private" });
    if (!blob || blob.statusCode !== 200) return null;
    const chunks: Uint8Array[] = [];
    for await (const chunk of blob.stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

const stats = {
  recipes: 0,
  changed: 0,
  external: 0,
  proxy: 0,
  public: 0,
  migrated: 0,
  deadExternal: [] as string[],
  failedProxy: [] as string[],
};


async function main() {
const rows = await db
  .select({
    id: recipes.id,
    userId: recipes.userId,
    title: recipes.title,
    images: recipes.images,
    prepSteps: recipes.prepSteps,
    cookingSteps: recipes.cookingSteps,
  })
  .from(recipes);

stats.recipes = rows.length;

// Migrate one referenced image; returns the new public URL, or null to leave
// the reference untouched. `privateBlobUrl` is the private-store source for
// proxy entries. Deletes the old private blob on success.
async function migrate(
  userId: string,
  recipeId: string,
  suffix: string,
  url: string,
  privateBlobUrl: string | undefined,
): Promise<{ url: string; deleted?: string } | null> {
  const kind = classify(url);
  if (kind === "public") {
    stats.public++;
    return null;
  }
  if (kind === "external") {
    stats.external++;
    const bytes = await bytesForExternal(url);
    if (!bytes) {
      stats.deadExternal.push(url);
      return null;
    }
    if (!APPLY) {
      stats.migrated++;
      return null;
    }
    const stored = await processAndStoreImage({
      userId,
      recipeId,
      bytes,
      suffix,
    });
    stats.migrated++;
    return { url: stored };
  }
  if (kind === "proxy") {
    stats.proxy++;
    if (!privateBlobUrl) {
      stats.failedProxy.push(`${recipeId} (no blobUrl)`);
      return null;
    }
    const bytes = await bytesForPrivate(privateBlobUrl);
    if (!bytes) {
      stats.failedProxy.push(`${recipeId} (unreadable)`);
      return null;
    }
    if (!APPLY) {
      stats.migrated++;
      return null;
    }
    const stored = await processAndStoreImage({
      userId,
      recipeId,
      bytes,
      suffix,
    });
    stats.migrated++;
    return { url: stored, deleted: privateBlobUrl };
  }
  return null;
}

for (const row of rows) {
  if (stats.changed >= LIMIT) break;
  const images = (row.images ?? []) as RecipeImage[];
  let changed = false;
  const toDelete: string[] = [];

  const newImages: RecipeImage[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const result = await migrate(
      row.userId,
      row.id,
      `hero${i}`,
      img.url,
      img.blobUrl,
    );
    if (result) {
      newImages.push({
        url: result.url,
        blobUrl: result.url,
        ...(img.alt ? { alt: img.alt } : {}),
      });
      if (result.deleted) toDelete.push(result.deleted);
      changed = true;
    } else {
      newImages.push(img);
    }
  }

  const remapSteps = async (steps: Step[]): Promise<Step[]> => {
    const out: Step[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.imageUrl) {
        out.push(step);
        continue;
      }
      const result = await migrate(
        row.userId,
        row.id,
        `step${i}`,
        step.imageUrl,
        undefined,
      );
      if (result) {
        out.push({ ...step, imageUrl: result.url });
        changed = true;
      } else {
        out.push(step);
      }
    }
    return out;
  };

  const newPrep = await remapSteps((row.prepSteps ?? []) as Step[]);
  const newCooking = await remapSteps((row.cookingSteps ?? []) as Step[]);

  if (changed) {
    stats.changed++;
    if (APPLY) {
      await db
        .update(recipes)
        .set({
          images: newImages,
          prepSteps: newPrep,
          cookingSteps: newCooking,
        })
        .where(eq(recipes.id, row.id));
      for (const url of toDelete) await del(url).catch(() => {});
      console.log(`migrated ${row.id} "${row.title}"`);
    } else {
      console.log(`would migrate ${row.id} "${row.title}"`);
    }
  }
}

console.log("\n=== summary ===");
console.log(JSON.stringify(stats, null, 2));
console.log(APPLY ? "\nAPPLIED." : "\nDRY RUN — rerun with --apply to write.");
process.exit(0);
}

main();
