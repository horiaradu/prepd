"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import type { RecipeSummary, ParseResponse } from "@/types/recipe";

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

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch(() => {})
      .finally(() => setLoadingRecipes(false));
  }, []);

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
      addRecipeToList(parsed);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function addRecipeToList(parsed: ParseResponse) {
    setRecipes((prev) => [
      {
        id: parsed.id,
        title: parsed.recipe.title,
        sourceUrl: parsed.sourceUrl,
        sourceType: parsed.sourceType,
        createdAt: new Date().toISOString(),
        imageUrl: parsed.imageUrl,
        cookCount: 0,
        lastCookedAt: null,
      },
      ...prev,
    ]);
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress({ step: "Preparing photo…", progress: 5 });

    try {
      const resized = await resizeImageForUpload(file);

      const formData = new FormData();
      formData.append("image", resized, "recipe.jpg");

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
      addRecipeToList(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <nav className="mb-8 flex items-center gap-4">
        <Link
          href="/suggest"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Suggest recipes
        </Link>
      </nav>

      <form onSubmit={handleParse} className="flex gap-2 mb-10">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a recipe URL or YouTube link"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
          required
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelected}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Upload a photo of a recipe"
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Parsing…" : "Parse"}
        </button>
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

      {!loadingRecipes && recipes.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter recipes…"
          className="w-full mb-6 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
        />
      )}

      {loadingRecipes && (
        <div className="text-center py-12 text-gray-400">Loading recipes…</div>
      )}

      {!loadingRecipes && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes
            .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
            .map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipe/${recipe.id}`}
                className="block overflow-hidden border border-gray-100 rounded-xl hover:border-green-600 transition-colors"
              >
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
                <div className="p-3.5">
                  <h2 className="font-semibold text-[0.9rem] mb-1 line-clamp-2">
                    {recipe.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[0.7rem] text-gray-400">
                    <span>
                      {recipe.sourceType === "youtube" ? "YouTube" : "Web"}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(recipe.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {recipe.cookCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-green-600 font-semibold">
                          🍳 {recipe.cookCount}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}

      {!loading && !loadingRecipes && recipes.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          No recipes yet. Paste a URL above to get started.
        </p>
      )}
    </div>
  );
}
