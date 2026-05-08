"use client";

import { useState, useRef } from "react";
import ProgressBar from "@/components/ProgressBar";
import { CameraIcon } from "@/components/icons";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import type { ParseResponse, RecipeSummary } from "@/types/recipe";

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
      cookCount: 0,
      lastCookedAt: null,
    };
  }

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const response = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to parse recipe");
      }

      const parsed = await readProgressStream<ParseResponse>(
        response,
        setProgress,
      );
      onRecipeParsed(toSummary(parsed));
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setProgress({ step: "Preparing photos…", progress: 5 });

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
        throw new Error("Failed to parse recipe from photo");
      }

      const parsed = await readProgressStream<ParseResponse>(
        response,
        setProgress,
      );
      onRecipeParsed(toSummary(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          placeholder="Paste a recipe or YouTube link"
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
            title="Upload a photo of a recipe"
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CameraIcon />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Parsing…" : "Parse"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="py-8">
          <ProgressBar
            step={progress?.step ?? "Starting…"}
            progress={progress?.progress ?? 5}
          />
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
