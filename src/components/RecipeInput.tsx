"use client";

import { useState, useRef } from "react";
import ProgressBar from "@/components/ProgressBar";
import { CameraIcon } from "@/components/icons";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import type { ParseResponse, RecipeSummary, SourceType } from "@/types/recipe";
import { useLanguage } from "@/context/LanguageContext";
import { trackRecipeParsed, type RecipeSource } from "@/lib/analytics-events";

async function resizeImageForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 2000;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
      "image/jpeg",
      0.88,
    );
  });
}

export default function RecipeInput({
  onRecipeParsed,
}: {
  onRecipeParsed: (recipe: RecipeSummary) => void;
}) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toSummary(parsed: ParseResponse): RecipeSummary {
    return {
      id: parsed.id,
      title: parsed.recipe.title,
      sourceUrl: parsed.sourceUrl,
      sourceType: parsed.sourceType,
      createdAt: new Date().toISOString(),
      imageUrl: parsed.imageUrl,
      mealType: parsed.recipe.mealType,
      cuisine: parsed.recipe.cuisine,
      cookStyle: parsed.recipe.cookStyle,
      totalTimeMinutes: parsed.recipe.totalTimeMinutes,
      status: "ready",
      parseError: null,
      cookCount: 0,
      lastCookedAt: null,
    };
  }

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429 ? t.errorTooManyParses : t.errorParseFailed,
        );
      }

      // The parse runs in the background; the list shows a "parsing" card
      // and polls until the recipe is ready.
      const data = (await response.json()) as {
        id: string;
        sourceType: SourceType;
      };
      onRecipeParsed({
        id: data.id,
        title: new URL(trimmedUrl).hostname,
        sourceUrl: trimmedUrl,
        sourceType: data.sourceType,
        createdAt: new Date().toISOString(),
        imageUrl: null,
        mealType: null,
        cuisine: null,
        cookStyle: null,
        totalTimeMinutes: null,
        status: "parsing",
        parseError: null,
        cookCount: 0,
        lastCookedAt: null,
      });
      trackRecipeParsed({
        recipeId: data.id,
        source: data.sourceType as RecipeSource,
      });
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setProgress({ step: t.preparingPhotos, progress: 5 });

    try {
      const resizedBlobs = await Promise.all(
        files.map((file) => resizeImageForUpload(file)),
      );

      const formData = new FormData();
      resizedBlobs.forEach((blob, i) => {
        formData.append("image", blob, `recipe-${i}.jpg`);
      });

      const response = await fetch("/api/recipes/parse-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 429 ? t.errorTooManyParses : t.errorParseFailed,
        );
      }

      const parsed = await readProgressStream<ParseResponse>(
        response,
        setProgress,
      );
      onRecipeParsed(toSummary(parsed));
      trackRecipeParsed({ recipeId: parsed.id, source: "image" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWentWrong);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <>
      <form onSubmit={handleParse} className="mb-10 space-y-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.pasteRecipeLink}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
          required
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelected}
          className="hidden"
        />
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title={t.uploadPhotoTitle}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CameraIcon />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t.parsing : t.parse}
          </button>
        </div>
      </form>

      {loading && progress && (
        <div className="py-8">
          <ProgressBar step={progress.step} progress={progress.progress} />
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
