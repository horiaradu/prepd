"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import type { Recipe } from "@/types/recipe";

interface CookLogEntry {
  id: string;
  tweaks: string | null;
  cookedAt: string;
}

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [cookHistory, setCookHistory] = useState<CookLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCookForm, setShowCookForm] = useState(false);
  const [tweaks, setTweaks] = useState("");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setRecipeId(id));
  }, [params]);

  const loadCookHistory = useCallback((id: string) => {
    fetch(`/api/recipes/${id}/cook`)
      .then((res) => res.json())
      .then((data) => setCookHistory(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recipeId) return;
    fetch(`/api/recipes/${recipeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Recipe not found");
        return res.json();
      })
      .then((data) => setRecipe(data))
      .catch((err) => setError(err.message));
    loadCookHistory(recipeId);
  }, [recipeId, loadCookHistory]);

  async function handleDelete() {
    if (!recipe || !confirm("Delete this recipe?")) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/");
  }

  async function handleLogCook() {
    if (!recipeId) return;
    setLogging(true);
    try {
      await fetch(`/api/recipes/${recipeId}/cook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweaks: tweaks.trim() || null }),
      });
      setTweaks("");
      setShowCookForm(false);
      loadCookHistory(recipeId);
    } finally {
      setLogging(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <p className="text-red-500">{error}</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 block">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back
        </Link>
        <div className="flex items-center gap-4">
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Source
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <RecipeDisplay recipe={recipe} />

      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
        {!showCookForm ? (
          <button
            onClick={() => setShowCookForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            I cooked this
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={tweaks}
              onChange={(e) => setTweaks(e.target.value)}
              placeholder="Any tweaks? (optional) e.g. used coconut milk instead of cream"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleLogCook}
                disabled={logging}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {logging ? "Saving…" : "Log cook"}
              </button>
              <button
                onClick={() => {
                  setShowCookForm(false);
                  setTweaks("");
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cookHistory.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">
              Cook history ({cookHistory.length})
            </h2>
            <ul className="space-y-3">
              {cookHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="text-sm border-l-2 border-green-400 pl-3"
                >
                  <span className="text-gray-500">
                    {new Date(entry.cookedAt).toLocaleDateString()}
                  </span>
                  {entry.tweaks && (
                    <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                      {entry.tweaks}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
