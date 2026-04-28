"use client";

import { useState } from "react";
import type { ParsedRecipe, Ingredient, Step } from "@/types/recipe";

function formatScaledQuantity(ingredient: Ingredient, scale: number): string {
  if (ingredient.unit === "to taste") {
    const notes = ingredient.notes ? ` (${ingredient.notes})` : "";
    return `${ingredient.unit} ${ingredient.name}${notes}`.trim();
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
}: {
  ingredients: Ingredient[];
  scale: number;
}) {
  if (ingredients.length === 0) return null;
  return (
    <ul className="mt-1 ml-6 text-sm text-gray-500 dark:text-gray-400">
      {ingredients.map((ing, i) => (
        <li key={i}>{formatScaledQuantity(ing, scale)}</li>
      ))}
    </ul>
  );
}

function StepList({
  title,
  steps,
  scale,
}: {
  title: string;
  steps: Step[];
  scale: number;
}) {
  if (steps.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
              {i + 1}
            </span>
            <div className="flex-1">
              <p>{step.instruction}</p>
              <StepIngredients ingredients={step.ingredients} scale={scale} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RecipeDisplay({ recipe }: { recipe: ParsedRecipe }) {
  const [servings, setServings] = useState<number | null>(recipe.servings);
  const scale = recipe.servings && servings ? servings / recipe.servings : 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {recipe.servings && (
          <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
            <span>Serves</span>
            <input
              type="number"
              min={1}
              value={servings ?? recipe.servings}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setServings(v > 0 ? v : null);
              }}
              className="w-16 px-2 py-0.5 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {servings !== recipe.servings && (
              <button
                onClick={() => setServings(recipe.servings)}
                className="text-xs text-blue-500 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
        <ul className="space-y-1">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>{formatScaledQuantity(ing, scale)}</span>
            </li>
          ))}
        </ul>
      </section>

      <StepList title="Preparation" steps={recipe.prepSteps} scale={scale} />
      <StepList title="Cooking" steps={recipe.cookingSteps} scale={scale} />
    </div>
  );
}
