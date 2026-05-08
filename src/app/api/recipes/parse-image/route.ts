import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";
import { parseRecipeFromImage } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const userId = session.user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));

      let blobUrls: string[] = [];

      try {
        send({ type: "progress", step: "Processing images…", progress: 15 });

        // Server-side safety resize: keeps stored copies bounded while
        // remaining readable for OCR.
        const resizedImages = await Promise.all(
          imageFiles.map(async (file) => {
            const bytes = Buffer.from(await file.arrayBuffer());
            const resized = await sharp(bytes)
              .rotate()
              .resize({
                width: 1600,
                height: 1600,
                fit: "inside",
                withoutEnlargement: true,
              })
              .jpeg({ quality: 82, mozjpeg: true })
              .toBuffer();
            return resized;
          }),
        );

        const uploads = await Promise.all(
          resizedImages.map((resized) =>
            put(`recipes/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`, resized, {
              access: "private",
              contentType: "image/jpeg",
            }),
          ),
        );
        blobUrls = uploads.map((u) => u.url);

        send({ type: "progress", step: "Reading recipe…", progress: 40 });
        const parsed = await parseRecipeFromImage(
          resizedImages.map((resized) => ({
            bytes: resized,
            mimeType: "image/jpeg",
          })),
        );

        send({ type: "progress", step: "Saving recipe…", progress: 85 });
        const [saved] = await db
          .insert(recipes)
          .values({
            userId,
            title: parsed.title,
            sourceUrl: blobUrls[0],
            sourceType: "image",
            servings: parsed.servings,
            ingredients: parsed.ingredients,
            prepSteps: parsed.prepSteps,
            cookingSteps: parsed.cookingSteps,
            images: [],
            originalRecipe: parsed,
            rawContent: null,
          })
          .returning();

        const imageUrl = `/api/recipes/${saved.id}/image?v=${Date.now()}`;
        const imageEntries = blobUrls.map((url, i) => ({
          url: i === 0 ? imageUrl : url,
          blobUrl: url,
        }));
        await db
          .update(recipes)
          .set({ images: imageEntries })
          .where(eq(recipes.id, saved.id));

        send({
          type: "done",
          data: {
            id: saved.id,
            recipe: parsed,
            sourceUrl: blobUrls[0],
            sourceType: "image",
            imageUrl,
          },
        });
      } catch (error) {
        console.error("Recipe parse-image error:", error);
        if (blobUrls.length > 0) await Promise.all(blobUrls.map((u) => del(u).catch(() => {})));
        const message =
          error instanceof Error ? error.message : "Failed to parse recipe";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
