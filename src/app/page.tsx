"use client";

import { useState } from "react";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import type { ParsedRecipe, ParseResponse } from "@/types/recipe";

export default function Home() {
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setRecipe(null);

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
      setRecipe(parsed.recipe);
      setSourceUrl(parsed.sourceUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Prepd</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Paste a recipe URL or YouTube video link
        </p>
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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {recipe && (
        <div>
          {sourceUrl && (
            <p className="text-sm text-gray-400 mb-4">
              Source:{" "}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {sourceUrl}
              </a>
            </p>
          )}
          <RecipeDisplay recipe={recipe} />
        </div>
      )}
    </div>
  );
}
