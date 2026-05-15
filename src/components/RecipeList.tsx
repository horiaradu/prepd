"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import RecipeInput from "@/components/RecipeInput";
import type { RecipeSummary } from "@/types/recipe";
import { useLanguage } from "@/context/LanguageContext";

export default function RecipeList({
  initialRecipes,
}: {
  initialRecipes: RecipeSummary[];
}) {
  const { t, locale } = useLanguage();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");

  const handleRecipeParsed = useCallback((recipe: RecipeSummary) => {
    setRecipes((prev) => [recipe, ...prev]);
  }, []);

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <nav className="mb-8 flex items-center gap-4">
        <Link
          href="/suggest"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          {t.suggestRecipes}
        </Link>
      </nav>

      <RecipeInput onRecipeParsed={handleRecipeParsed} />

      {recipes.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.filterRecipes}
          className="w-full mb-6 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
        />
      )}

      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe) => (
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
                    {recipe.sourceType === "youtube" ? t.sourceYouTube : t.sourceWeb}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(recipe.createdAt).toLocaleDateString(locale, {
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
      ) : (
        <p className="text-center text-gray-400 py-12">
          {t.noRecipesYet}
        </p>
      )}
    </>
  );
}
