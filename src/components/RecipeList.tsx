"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import RecipeInput from "@/components/RecipeInput";
import { Dropdown } from "@/components/Dropdown";
import { parseErrorMessage } from "@/lib/parse-error";
import {
  COOK_STYLES,
  MEAL_TYPES,
  TIME_BUCKETS,
  timeBucketFor,
  type Cuisine,
  type CookStyle,
  type MealType,
  type RecipeSummary,
  type TimeBucket,
} from "@/types/recipe";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/i18n";
import { trackRecipeListFiltered } from "@/lib/analytics-events";

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

function cuisineLabel(cuisine: Cuisine, t: Translations): string {
  switch (cuisine) {
    case "american": return t.cuisineAmerican;
    case "british": return t.cuisineBritish;
    case "chinese": return t.cuisineChinese;
    case "european": return t.cuisineEuropean;
    case "french": return t.cuisineFrench;
    case "fusion": return t.cuisineFusion;
    case "greek": return t.cuisineGreek;
    case "indian": return t.cuisineIndian;
    case "italian": return t.cuisineItalian;
    case "japanese": return t.cuisineJapanese;
    case "korean": return t.cuisineKorean;
    case "mediterranean": return t.cuisineMediterranean;
    case "mexican": return t.cuisineMexican;
    case "middle-eastern": return t.cuisineMiddleEastern;
    case "moroccan": return t.cuisineMoroccan;
    case "romanian": return t.cuisineRomanian;
    case "spanish": return t.cuisineSpanish;
    case "thai": return t.cuisineThai;
    case "turkish": return t.cuisineTurkish;
    case "vietnamese": return t.cuisineVietnamese;
    case "other": return t.cuisineOther;
  }
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
  const [cuisineFilter, setCuisineFilter] = useState<Cuisine | "all">("all");
  const [cookStyleFilter, setCookStyleFilter] = useState<CookStyle | "all">(
    "all",
  );
  const [timeFilter, setTimeFilter] = useState<TimeBucket | "all">("all");
  const [cookFilter, setCookFilter] = useState<"all" | "tried" | "untried">("all");

  const handleRecipeParsed = useCallback((recipe: RecipeSummary) => {
    setRecipes((prev) => [recipe, ...prev]);
  }, []);

  // While a parse runs in the background (or a fresh recipe still waits for
  // its image), refresh the list every few seconds. Polling stops on its own
  // once everything has settled.
  useEffect(() => {
    const needsPolling = recipes.some(
      (r) =>
        r.status === "parsing" ||
        (r.status === "ready" &&
          !r.imageUrl &&
          Date.now() - new Date(r.createdAt).getTime() < 10 * 60_000),
    );
    if (!needsPolling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/recipes");
        if (!res.ok) return;
        setRecipes((await res.json()) as RecipeSummary[]);
      } catch {
        // Transient network failure — next tick retries.
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [recipes]);

  const retryParse = useCallback(async (recipe: RecipeSummary) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipe.id ? { ...r, status: "parsing", parseError: null } : r,
      ),
    );
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipe.sourceUrl, replaceId: recipe.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id ? { ...r, status: "failed" } : r,
        ),
      );
    }
  }, []);

  const dismissFailedParse = useCallback(async (recipe: RecipeSummary) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" }).catch(
      () => {},
    );
  }, []);

  const inProgress = useMemo(
    () => recipes.filter((r) => r.status !== "ready"),
    [recipes],
  );
  const readyRecipes = useMemo(
    () => recipes.filter((r) => r.status === "ready"),
    [recipes],
  );

  const cuisineOptions = useMemo(() => {
    const counts = new Map<Cuisine, number>();
    for (const r of readyRecipes) {
      if (!r.cuisine) continue;
      counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([cuisine]) => cuisine);
  }, [readyRecipes]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return readyRecipes.filter((r) => {
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
      if (cookFilter === "untried" && r.cookCount > 0) return false;
      if (cookFilter === "tried" && r.cookCount === 0) return false;
      return true;
    });
  }, [
    readyRecipes,
    search,
    mealFilter,
    cuisineFilter,
    cookStyleFilter,
    timeFilter,
    cookFilter,
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
    cookFilter !== "all";

  function clearFilters() {
    setMealFilter("all");
    setCuisineFilter("all");
    setCookStyleFilter("all");
    setTimeFilter("all");
    setCookFilter("all");
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

      {inProgress.length > 0 && (
        <div className="mb-6 space-y-3">
          {inProgress.map((recipe) =>
            recipe.status === "parsing" ? (
              <div
                key={recipe.id}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50"
              >
                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {recipe.title}
                  </p>
                  <p className="text-xs text-gray-400">{t.statusParsing}</p>
                </div>
              </div>
            ) : (
              <div
                key={recipe.id}
                className="p-4 border border-red-200 bg-red-50 rounded-xl"
              >
                <p className="text-sm font-medium text-red-700 truncate mb-1">
                  {recipe.title}
                </p>
                <p className="text-xs text-red-600 mb-3">
                  {parseErrorMessage(recipe.parseError, t)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => retryParse(recipe)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    {t.retryParse}
                  </button>
                  <button
                    onClick={() => dismissFailedParse(recipe)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t.dismissFailedParse}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.filterRecipes}
        className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
      />

      {readyRecipes.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Dropdown<MealType | "all">
            label={t.filterMealType}
            value={mealFilter}
            activeValue="all"
            onChange={(v) => {
              setMealFilter(v);
              trackRecipeListFiltered({ filter_category: "meal_type", filter_value: v });
            }}
            options={[
              { value: "all", label: t.filterAll },
              ...MEAL_TYPES.map((m) => ({
                value: m,
                label: mealLabel(m, t),
              })),
            ]}
          />
          {cuisineOptions.length > 0 && (
            <Dropdown<Cuisine | "all">
              label={t.filterCuisine}
              value={cuisineFilter}
              activeValue="all"
              onChange={(v) => {
                setCuisineFilter(v);
                trackRecipeListFiltered({ filter_category: "cuisine", filter_value: v });
              }}
              options={[
                { value: "all", label: t.filterAll },
                ...cuisineOptions.map((c) => ({
                  value: c,
                  label: cuisineLabel(c, t),
                })),
              ]}
            />
          )}
          <Dropdown<CookStyle | "all">
            label={t.filterCookStyle}
            value={cookStyleFilter}
            activeValue="all"
            onChange={(v) => {
              setCookStyleFilter(v);
              trackRecipeListFiltered({ filter_category: "cook_style", filter_value: v });
            }}
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
            onChange={(v) => {
              setTimeFilter(v);
              trackRecipeListFiltered({ filter_category: "time", filter_value: v });
            }}
            options={[
              { value: "all", label: t.filterAll },
              ...TIME_BUCKETS.map((b) => ({
                value: b,
                label: timeBucketLabel(b, t),
              })),
            ]}
          />
          <Dropdown<"all" | "tried" | "untried">
            label={t.filterCooked}
            value={cookFilter}
            activeValue="all"
            onChange={(v) => {
              setCookFilter(v);
              trackRecipeListFiltered({ filter_category: "cooked", filter_value: v });
            }}
            options={[
              { value: "all", label: t.filterAll },
              { value: "tried", label: t.filterTried },
              { value: "untried", label: t.filterUntried },
            ]}
          />
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

      {readyRecipes.length === 0 ? (
        inProgress.length === 0 && (
          <p className="text-center text-gray-400 py-12">{t.noRecipesYet}</p>
        )
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
                              {cuisineLabel(recipe.cuisine, t)}
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
