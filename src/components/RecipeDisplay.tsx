"use client";

import { useState, useEffect } from "react";
import type { ParsedRecipe, Ingredient, Step } from "@/types/recipe";
import { useLanguage } from "@/context/LanguageContext";

function formatScaledQuantity(
  ingredient: Ingredient,
  scale: number,
  toTasteLabel: string,
): string {
  if (ingredient.unit === "to taste" || ingredient.quantity === 0) {
    const notes = ingredient.notes ? ` (${ingredient.notes})` : "";
    return `${toTasteLabel} ${ingredient.name}${notes}`.trim();
  }
  const scaled = ingredient.quantity * scale;
  const display = Number.isInteger(scaled) ? scaled : +scaled.toFixed(2);
  const unit = ingredient.unit === "piece" ? "" : ingredient.unit;
  const notes = ingredient.notes ? ` (${ingredient.notes})` : "";
  return `${display} ${unit} ${ingredient.name}${notes}`.trim();
}

function StepIngredients({
  ingredients,
  scale,
  toTasteLabel,
}: {
  ingredients: Ingredient[];
  scale: number;
  toTasteLabel: string;
}) {
  if (ingredients.length === 0) return null;
  return (
    <ul className="mt-1 ml-6 text-sm text-gray-500">
      {ingredients.map((ing, i) => (
        <li key={i}>{formatScaledQuantity(ing, scale, toTasteLabel)}</li>
      ))}
    </ul>
  );
}

function formatTimestamp(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function extractDuration(text: string): string | null {
  const match = text.match(
    /(\d+[–—-]\d+|\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i,
  );
  if (!match) return null;
  return `${match[1]} ${match[2]}`;
}

function StepList({
  title,
  steps,
  scale,
  videoBaseUrl,
  onImageClick,
  toTasteLabel,
  watchAtTemplate,
}: {
  title: string;
  steps: Step[];
  scale: number;
  videoBaseUrl?: string;
  onImageClick: (url: string) => void;
  toTasteLabel: string;
  watchAtTemplate: string;
}) {
  if (steps.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
              {i + 1}
            </span>
            <div className="flex-1">
              <p>{step.instruction}</p>
              {extractDuration(step.instruction) && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  ⏱ {extractDuration(step.instruction)}
                </span>
              )}
              <StepIngredients
                ingredients={step.ingredients}
                scale={scale}
                toTasteLabel={toTasteLabel}
              />
              {step.imageUrl && (
                <img
                  src={step.imageUrl}
                  alt={step.instruction}
                  className="mt-2 rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onImageClick(step.imageUrl!)}
                />
              )}
              {videoBaseUrl && step.videoTimestamp != null && (
                <a
                  href={`${videoBaseUrl}&t=${step.videoTimestamp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs text-red-500 hover:text-red-600"
                >
                  {watchAtTemplate.replace(
                    "{time}",
                    formatTimestamp(step.videoTimestamp),
                  )}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RecipeDisplay({
  recipe,
  sourceUrl,
  heroImageUrl,
  children,
}: {
  recipe: ParsedRecipe;
  sourceUrl?: string;
  heroImageUrl?: string;
  children?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [servings, setServings] = useState<number | null>(recipe.servings);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const scale = recipe.servings && servings ? servings / recipe.servings : 1;

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  const videoBaseUrl = sourceUrl?.includes("youtube.com/watch")
    ? sourceUrl
    : sourceUrl?.includes("youtu.be/")
      ? `https://www.youtube.com/watch?v=${sourceUrl.split("youtu.be/")[1]?.split(/[?#]/)[0]}`
      : undefined;

  return (
    <div className="space-y-8">
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {heroImageUrl && (
        <img
          src={heroImageUrl}
          alt={recipe.title}
          className="w-full max-h-96 object-cover rounded-lg cursor-zoom-in"
          onClick={() => setLightboxUrl(heroImageUrl)}
        />
      )}

      {children}

      <div>
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {recipe.servings && (
          <div className="flex items-center gap-2 mt-1 text-gray-500">
            <span>{t.serves}</span>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  setServings((s) => {
                    const cur = s ?? recipe.servings ?? 1;
                    return cur > 1 ? cur - 1 : 1;
                  })
                }
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-l bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={servings ?? recipe.servings}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setServings(v > 0 ? v : null);
                }}
                className="w-12 h-8 px-1 text-center border-y border-gray-200 bg-gray-50 focus:outline-none focus:border-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() =>
                  setServings((s) => (s ?? recipe.servings ?? 1) + 1)
                }
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-r bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
            {servings !== recipe.servings && (
              <button
                onClick={() => setServings(recipe.servings)}
                className="text-xs text-green-600 hover:underline"
              >
                {t.reset}
              </button>
            )}
          </div>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">{t.ingredients}</h2>
        <ul className="space-y-1">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>{formatScaledQuantity(ing, scale, t.toTaste)}</span>
            </li>
          ))}
        </ul>
      </section>

      <StepList
        title={t.preparation}
        steps={recipe.prepSteps}
        scale={scale}
        videoBaseUrl={videoBaseUrl}
        onImageClick={setLightboxUrl}
        toTasteLabel={t.toTaste}
        watchAtTemplate={t.watchAt}
      />
      <StepList
        title={t.cooking}
        steps={recipe.cookingSteps}
        scale={scale}
        videoBaseUrl={videoBaseUrl}
        onImageClick={setLightboxUrl}
        toTasteLabel={t.toTaste}
        watchAtTemplate={t.watchAt}
      />
    </div>
  );
}
