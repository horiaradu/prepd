"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import type { RecipeSummary, ParseResponse } from "@/types/recipe";

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);

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
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <header className="mb-10 flex items-center justify-between pb-4 border-b border-gray-100">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-8 h-8 rounded-lg"
          />
          Prepd
        </h1>
        <nav className="flex items-center gap-6">
          <Link
            href="/suggest"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Suggest recipes
          </Link>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </nav>
      </header>

      <form onSubmit={handleParse} className="flex gap-2 mb-10">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a recipe URL or YouTube link"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
          required
        />
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
