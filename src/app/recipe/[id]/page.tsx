"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import type { Recipe } from "@/types/recipe";

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/recipes/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Recipe not found");
          return res.json();
        })
        .then((data) => setRecipe(data))
        .catch((err) => setError(err.message));
    });
  }, [params]);

  async function handleDelete() {
    if (!recipe || !confirm("Delete this recipe?")) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/");
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
    </div>
  );
}
