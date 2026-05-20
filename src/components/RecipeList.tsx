"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import RecipeInput from "@/components/RecipeInput";
import { Dropdown } from "@/components/Dropdown";
import {
  COOK_STYLES,
  MEAL_TYPES,
  TIME_BUCKETS,
  timeBucketFor,
  type CookStyle,
  type MealType,
  type RecipeSummary,
  type TimeBucket,
} from "@/types/recipe";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/i18n";

function mealLabel(meal: MealType, t: Translations): string {
  switch (meal) {
    case "breakfast":
      return t.mealBreakfast;
    case "main":
      return t.mealMain;
    case "side":
      return t.mealSide;
    case "soup":
      return t.mealSoup;
    case "salad":
      return t.mealSalad;
    case "dessert":
      return t.mealDessert;
    case "snack":
      return t.mealSnack;
    case "drink":
      return t.mealDrink;
    case "sauce":
      return t.mealSauce;
    case "bread":
      return t.mealBread;
    case "other":
      return t.mealOther;
  }
}

function cookStyleLabel(style: CookStyle, t: Translations): string {
  switch (style) {
    case "no-cook":
      return t.cookNoCook;
    case "stovetop":
      return t.cookStovetop;
    case "oven":
      return t.cookOven;
    case "grill":
      return t.cookGrill;
    case "slow-cooker":
      return t.cookSlowCooker;
    case "mixed":
      return t.cookMixed;
  }
}

function timeBucketLabel(bucket: TimeBucket, t: Translations): string {
  switch (bucket) {
    case "under-30":
      return t.timeUnder30;
    case "30-60":
      return t.time30to60;
    case "60-120":
      return t.time60to120;
    case "over-120":
      return t.timeOver120;
  }
}

function cuisineLabel(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Order recipes inside a group: cooked-recently first, then by createdAt desc.
// Matches the server-side ordering of getRecipeSummaries.
function compareRecipes(a: RecipeSummary, b: RecipeSummary): number {
  if (a.lastCookedAt && b.lastCookedAt) {
    return b.lastCookedAt.localeCompare(a.lastCookedAt);
  }
  if (a.lastCookedAt) return -1;
  if (b.lastCookedAt) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

export default function RecipeList({
  initialRecipes,
}: {
  initialRecipes: RecipeSummary[];
}) {
  const { t, locale } = useLanguage();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<MealType | "all">("all");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [cookStyleFilter, setCookStyleFilter] = useState<CookStyle | "all">(
    "all",
  );
  const [timeFilter, setTimeFilter] = useState<TimeBucket | "all">("all");
  const [untriedOnly, setUntriedOnly] = useState(false);

  const handleRecipeParsed = useCallback((recipe: RecipeSummary) => {
    setRecipes((prev) => [recipe, ...prev]);
  }, []);

  const cuisineOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) {
      if (!r.cuisine) continue;
      counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([slug]) => slug);
  }, [recipes]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (needle && !r.title.toLowerCase().includes(needle)) return false;
      if (mealFilter !== "all" && r.mealType !== mealFilter) return false;
      if (cuisineFilter !== "all" && r.cuisine !== cuisineFilter) return false;
      if (cookStyleFilter !== "all" && r.cookStyle !== cookStyleFilter)
        return false;
      if (
        timeFilter !== "all" &&
        timeBucketFor(r.totalTimeMinutes) !== timeFilter
      )
        return false;
      if (untriedOnly && r.cookCount > 0) return false;
      return true;
    });
  }, [
    recipes,
    search,
    mealFilter,
    cuisineFilter,
    cookStyleFilter,
    timeFilter,
    untriedOnly,
  ]);

  const grouped = useMemo(() => {
    const groups = new Map<MealType | "uncategorized", RecipeSummary[]>();
    for (const r of filtered) {
      const key = r.mealType ?? "uncategorized";
      const bucket = groups.get(key) ?? [];
      bucket.push(r);
      groups.set(key, bucket);
    }
    for (const list of groups.values()) list.sort(compareRecipes);
    const order: (MealType | "uncategorized")[] = [
      ...MEAL_TYPES,
      "uncategorized",
    ];
    return order
      .filter((k) => groups.has(k))
      .map((k) => ({ key: k, recipes: groups.get(k)! }));
  }, [filtered]);

  const anyFilterActive =
    mealFilter !== "all" ||
    cuisineFilter !== "all" ||
    cookStyleFilter !== "all" ||
    timeFilter !== "all" ||
    untriedOnly;

  function clearFilters() {
    setMealFilter("all");
    setCuisineFilter("all");
    setCookStyleFilter("all");
    setTimeFilter("all");
    setUntriedOnly(false);
  }

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

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.filterRecipes}
        className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
      />

      {recipes.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Dropdown<MealType | "all">
            label={t.filterMealType}
            value={mealFilter}
            activeValue="all"
            onChange={setMealFilter}
            options={[
              { value: "all", label: t.filterAll },
              ...MEAL_TYPES.map((m) => ({
                value: m,
                label: mealLabel(m, t),
              })),
            ]}
          />
          {cuisineOptions.length > 0 && (
            <Dropdown<string>
              label={t.filterCuisine}
              value={cuisineFilter}
              activeValue="all"
              onChange={setCuisineFilter}
              options={[
                { value: "all", label: t.filterAll },
                ...cuisineOptions.map((c) => ({
                  value: c,
                  label: cuisineLabel(c),
                })),
              ]}
            />
          )}
          <Dropdown<CookStyle | "all">
            label={t.filterCookStyle}
            value={cookStyleFilter}
            activeValue="all"
            onChange={setCookStyleFilter}
            options={[
              { value: "all", label: t.filterAll },
              ...COOK_STYLES.map((s) => ({
                value: s,
                label: cookStyleLabel(s, t),
              })),
            ]}
          />
          <Dropdown<TimeBucket | "all">
            label={t.filterTime}
            value={timeFilter}
            activeValue="all"
            onChange={setTimeFilter}
            options={[
              { value: "all", label: t.filterAll },
              ...TIME_BUCKETS.map((b) => ({
                value: b,
                label: timeBucketLabel(b, t),
              })),
            ]}
          />
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 px-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={untriedOnly}
              onChange={(e) => setUntriedOnly(e.target.checked)}
              className="accent-green-600"
            />
            {t.filterUntried}
          </label>
          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              {t.filterClear}
            </button>
          )}
        </div>
      )}

      {recipes.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{t.noRecipesYet}</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{t.noRecipesYet}</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ key, recipes: groupRecipes }) => (
            <section key={key}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-baseline gap-2">
                <span>
                  {key === "uncategorized"
                    ? t.mealUncategorized
                    : mealLabel(key, t)}
                </span>
                <span className="text-xs font-normal text-gray-400">
                  {groupRecipes.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    className="block overflow-hidden border border-gray-100 rounded-xl hover:border-green-600 transition-colors"
                  >
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        referrerPolicy="no-referrer"
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
                      <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem] text-gray-400">
                        {recipe.cuisine && (
                          <>
                            <span className="text-gray-500">
                              {cuisineLabel(recipe.cuisine)}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        {recipe.totalTimeMinutes != null && (
                          <>
                            <span>
                              {t.timeMinutes.replace(
                                "{min}",
                                String(recipe.totalTimeMinutes),
                              )}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span>
                          {new Date(recipe.createdAt).toLocaleDateString(
                            locale,
                            { month: "short", day: "numeric" },
                          )}
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
            </section>
          ))}
        </div>
      )}
    </>
  );
}
