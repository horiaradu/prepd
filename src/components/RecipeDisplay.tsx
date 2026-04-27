import type { ParsedRecipe, Ingredient, Step } from "@/types/recipe";

function formatQuantity(ingredient: Ingredient): string {
  const qty = ingredient.unit === "to taste" ? "" : `${ingredient.quantity} `;
  const unit = ingredient.unit === "piece" ? "" : ingredient.unit;
  const notes = ingredient.notes ? ` (${ingredient.notes})` : "";
  return `${qty}${unit} ${ingredient.name}${notes}`.trim();
}

function StepIngredients({ ingredients }: { ingredients: Ingredient[] }) {
  if (ingredients.length === 0) return null;
  return (
    <ul className="mt-1 ml-6 text-sm text-gray-500 dark:text-gray-400">
      {ingredients.map((ing, i) => (
        <li key={i}>{formatQuantity(ing)}</li>
      ))}
    </ul>
  );
}

function StepList({ title, steps }: { title: string; steps: Step[] }) {
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
              <StepIngredients ingredients={step.ingredients} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RecipeDisplay({ recipe }: { recipe: ParsedRecipe }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {recipe.servings && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Serves {recipe.servings}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
        <ul className="space-y-1">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>{formatQuantity(ing)}</span>
            </li>
          ))}
        </ul>
      </section>

      <StepList title="Preparation" steps={recipe.prepSteps} />
      <StepList title="Cooking" steps={recipe.cookingSteps} />
    </div>
  );
}
