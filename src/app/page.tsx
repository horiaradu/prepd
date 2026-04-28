"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import type { RecipeSummary, ParseResponse } from "@/types/recipe";

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch(() => {});
  }, []);

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse recipe");
      }

      const parsed = data as ParseResponse;
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
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">Prepd</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Paste a recipe URL or YouTube video link
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Sign out
        </button>
      </header>

      <form onSubmit={handleParse} className="flex gap-3 mb-8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or recipe blog URL"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Parsing…" : "Parse"}
        </button>
      </form>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Extracting and structuring recipe…</p>
          <p className="text-sm mt-1">This may take a few seconds</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="block overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-1 line-clamp-2">
                  {recipe.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>
                    {recipe.sourceType === "youtube" ? "YouTube" : "Web"}
                  </span>
                  <span>·</span>
                  <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
                  {recipe.cookCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-green-500">
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

      {!loading && recipes.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          No recipes yet. Paste a URL above to get started.
        </p>
      )}
    </div>
  );
}
