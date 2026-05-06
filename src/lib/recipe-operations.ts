import type { Ingredient, ParsedRecipe, Step } from "@/types/recipe";

const VALID_UNITS = new Set<string>([
  "g", "kg", "ml", "l", "tsp", "tbsp", "piece", "pinch", "to taste",
]);

// ── Operation types ──────────────────────────────────────────────────────────

export type Operation =
  | { op: "set_title"; title: string; rationale: string }
  | {
      op: "set_servings";
      servings: number;
      scaleIngredients: boolean;
      rationale: string;
    }
  | { op: "scale"; factor: number; rationale: string }
  | {
      op: "add_ingredient";
      ingredient: Ingredient;
      position?: number;
      rationale: string;
    }
  | { op: "remove_ingredient"; name: string; rationale: string }
  | {
      op: "update_ingredient";
      name: string;
      changes: Partial<Ingredient>;
      rationale: string;
    }
  | {
      op: "replace_ingredient";
      from: string;
      to: Ingredient;
      rationale: string;
    }
  | {
      op: "add_step";
      section: "prepSteps" | "cookingSteps";
      step: Step;
      position?: number;
      rationale: string;
    }
  | {
      op: "remove_step";
      section: "prepSteps" | "cookingSteps";
      index: number;
      rationale: string;
    }
  | {
      op: "update_step";
      section: "prepSteps" | "cookingSteps";
      index: number;
      changes: Partial<Step>;
      rationale: string;
    }
  | {
      op: "move_step";
      from: { section: "prepSteps" | "cookingSteps"; index: number };
      to: { section: "prepSteps" | "cookingSteps"; index: number };
      rationale: string;
    };

// ── Validation ───────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

function ingredientNames(recipe: ParsedRecipe): Set<string> {
  return new Set(recipe.ingredients.map((i) => i.name.toLowerCase()));
}

function validateIngredient(ing: Ingredient, path: string): string[] {
  const errors: string[] = [];
  if (!ing.name?.trim()) errors.push(`${path}: name is required`);
  if (typeof ing.quantity !== "number" || ing.quantity < 0)
    errors.push(`${path}: quantity must be a non-negative number`);
  if (!VALID_UNITS.has(ing.unit))
    errors.push(`${path}: invalid unit "${ing.unit}"`);
  return errors;
}

export function validateOperations(
  recipe: ParsedRecipe,
  ops: Operation[],
): ValidationResult {
  const errors: string[] = [];
  const names = ingredientNames(recipe);

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const prefix = `op[${i}] (${op.op})`;

    switch (op.op) {
      case "set_title":
        if (!op.title?.trim()) errors.push(`${prefix}: title is required`);
        break;

      case "set_servings":
        if (typeof op.servings !== "number" || op.servings <= 0)
          errors.push(`${prefix}: servings must be a positive number`);
        break;

      case "scale":
        if (typeof op.factor !== "number" || op.factor <= 0)
          errors.push(`${prefix}: factor must be a positive number`);
        break;

      case "add_ingredient":
        errors.push(...validateIngredient(op.ingredient, prefix));
        if (
          op.position !== undefined &&
          (op.position < 0 || op.position > recipe.ingredients.length)
        )
          errors.push(`${prefix}: position out of range`);
        break;

      case "remove_ingredient":
        if (!names.has(op.name.toLowerCase()))
          errors.push(`${prefix}: ingredient "${op.name}" not found`);
        break;

      case "update_ingredient":
        if (!names.has(op.name.toLowerCase()))
          errors.push(`${prefix}: ingredient "${op.name}" not found`);
        if (op.changes.unit && !VALID_UNITS.has(op.changes.unit))
          errors.push(`${prefix}: invalid unit "${op.changes.unit}"`);
        if (
          op.changes.quantity !== undefined &&
          (typeof op.changes.quantity !== "number" || op.changes.quantity < 0)
        )
          errors.push(`${prefix}: quantity must be a non-negative number`);
        break;

      case "replace_ingredient":
        if (!names.has(op.from.toLowerCase()))
          errors.push(`${prefix}: ingredient "${op.from}" not found`);
        errors.push(...validateIngredient(op.to, `${prefix}.to`));
        break;

      case "add_step": {
        const section = recipe[op.section];
        if (
          op.position !== undefined &&
          (op.position < 0 || op.position > section.length)
        )
          errors.push(`${prefix}: position out of range`);
        if (!op.step?.instruction?.trim())
          errors.push(`${prefix}: step instruction is required`);
        break;
      }

      case "remove_step": {
        const section = recipe[op.section];
        if (op.index < 0 || op.index >= section.length)
          errors.push(`${prefix}: index ${op.index} out of range`);
        break;
      }

      case "update_step": {
        const section = recipe[op.section];
        if (op.index < 0 || op.index >= section.length)
          errors.push(`${prefix}: index ${op.index} out of range`);
        break;
      }

      case "move_step": {
        const fromSection = recipe[op.from.section];
        if (op.from.index < 0 || op.from.index >= fromSection.length)
          errors.push(`${prefix}: from.index out of range`);
        break;
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateRecipe(recipe: ParsedRecipe): ValidationResult {
  const errors: string[] = [];

  if (!recipe.title?.trim()) errors.push("title is required");
  if (
    recipe.servings !== null &&
    (typeof recipe.servings !== "number" || recipe.servings <= 0)
  )
    errors.push("servings must be a positive number");

  recipe.ingredients.forEach((ing, i) => {
    errors.push(...validateIngredient(ing, `ingredients[${i}]`));
  });

  (["prepSteps", "cookingSteps"] as const).forEach((section) => {
    recipe[section].forEach((step, i) => {
      if (!step.instruction?.trim())
        errors.push(`${section}[${i}]: instruction is required`);
      step.ingredients.forEach((ing, j) => {
        errors.push(
          ...validateIngredient(ing, `${section}[${i}].ingredients[${j}]`),
        );
      });
    });
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// ── Apply ────────────────────────────────────────────────────────────────────

function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  return { ...ing, quantity: Math.round(ing.quantity * factor * 100) / 100 };
}

function scaleStep(step: Step, factor: number): Step {
  return {
    ...step,
    ingredients: step.ingredients.map((i) => scaleIngredient(i, factor)),
  };
}

function normalise(name: string) {
  return name.toLowerCase().trim();
}

export function applyOperations(
  recipe: ParsedRecipe,
  ops: Operation[],
): ParsedRecipe {
  let r: ParsedRecipe = structuredClone(recipe);

  for (const op of ops) {
    switch (op.op) {
      case "set_title":
        r = { ...r, title: op.title };
        break;

      case "set_servings": {
        if (op.scaleIngredients && r.servings && r.servings > 0) {
          const factor = op.servings / r.servings;
          r = {
            ...r,
            servings: op.servings,
            ingredients: r.ingredients.map((i) => scaleIngredient(i, factor)),
            prepSteps: r.prepSteps.map((s) => scaleStep(s, factor)),
            cookingSteps: r.cookingSteps.map((s) => scaleStep(s, factor)),
          };
        } else {
          r = { ...r, servings: op.servings };
        }
        break;
      }

      case "scale":
        r = {
          ...r,
          ingredients: r.ingredients.map((i) => scaleIngredient(i, op.factor)),
          prepSteps: r.prepSteps.map((s) => scaleStep(s, op.factor)),
          cookingSteps: r.cookingSteps.map((s) => scaleStep(s, op.factor)),
        };
        break;

      case "add_ingredient": {
        const idx =
          op.position !== undefined ? op.position : r.ingredients.length;
        const ings = [...r.ingredients];
        ings.splice(idx, 0, op.ingredient);
        r = { ...r, ingredients: ings };
        break;
      }

      case "remove_ingredient": {
        const target = normalise(op.name);
        r = {
          ...r,
          ingredients: r.ingredients.filter(
            (i) => normalise(i.name) !== target,
          ),
          prepSteps: r.prepSteps.map((s) => ({
            ...s,
            ingredients: s.ingredients.filter(
              (i) => normalise(i.name) !== target,
            ),
          })),
          cookingSteps: r.cookingSteps.map((s) => ({
            ...s,
            ingredients: s.ingredients.filter(
              (i) => normalise(i.name) !== target,
            ),
          })),
        };
        break;
      }

      case "update_ingredient": {
        const target = normalise(op.name);
        r = {
          ...r,
          ingredients: r.ingredients.map((i) =>
            normalise(i.name) === target ? { ...i, ...op.changes } : i,
          ),
          prepSteps: r.prepSteps.map((s) => ({
            ...s,
            ingredients: s.ingredients.map((i) =>
              normalise(i.name) === target ? { ...i, ...op.changes } : i,
            ),
          })),
          cookingSteps: r.cookingSteps.map((s) => ({
            ...s,
            ingredients: s.ingredients.map((i) =>
              normalise(i.name) === target ? { ...i, ...op.changes } : i,
            ),
          })),
        };
        break;
      }

      case "replace_ingredient": {
        const target = normalise(op.from);
        r = {
          ...r,
          ingredients: r.ingredients.map((i) =>
            normalise(i.name) === target ? op.to : i,
          ),
          prepSteps: r.prepSteps.map((s) => ({
            ...s,
            ingredients: s.ingredients.map((i) =>
              normalise(i.name) === target ? op.to : i,
            ),
          })),
          cookingSteps: r.cookingSteps.map((s) => ({
            ...s,
            ingredients: s.ingredients.map((i) =>
              normalise(i.name) === target ? op.to : i,
            ),
          })),
        };
        break;
      }

      case "add_step": {
        const section = [...r[op.section]];
        const idx = op.position !== undefined ? op.position : section.length;
        section.splice(idx, 0, op.step);
        r = { ...r, [op.section]: section };
        break;
      }

      case "remove_step": {
        const section = [...r[op.section]];
        section.splice(op.index, 1);
        r = { ...r, [op.section]: section };
        break;
      }

      case "update_step": {
        const section = r[op.section].map((s, i) =>
          i === op.index ? { ...s, ...op.changes } : s,
        );
        r = { ...r, [op.section]: section };
        break;
      }

      case "move_step": {
        const fromSection = [...r[op.from.section]];
        const [moved] = fromSection.splice(op.from.index, 1);

        if (op.from.section === op.to.section) {
          fromSection.splice(op.to.index, 0, moved);
          r = { ...r, [op.from.section]: fromSection };
        } else {
          const toSection = [...r[op.to.section]];
          toSection.splice(op.to.index, 0, moved);
          r = {
            ...r,
            [op.from.section]: fromSection,
            [op.to.section]: toSection,
          };
        }
        break;
      }
    }
  }

  return r;
}

// ── Describe ─────────────────────────────────────────────────────────────────

export function describeOperation(op: Operation): string {
  if (op.rationale) return op.rationale;

  switch (op.op) {
    case "set_title":
      return `Changed title to "${op.title}"`;
    case "set_servings":
      return `Set servings to ${op.servings}${op.scaleIngredients ? " and scaled ingredient quantities" : ""}`;
    case "scale":
      return `Scaled all quantities by ${op.factor}×`;
    case "add_ingredient":
      return `Added ${op.ingredient.name}`;
    case "remove_ingredient":
      return `Removed ${op.name}`;
    case "update_ingredient":
      return `Updated ${op.name}`;
    case "replace_ingredient":
      return `Replaced ${op.from} with ${op.to.name}`;
    case "add_step":
      return `Added step to ${op.section === "prepSteps" ? "prep" : "cooking"}`;
    case "remove_step":
      return `Removed ${op.section === "prepSteps" ? "prep" : "cooking"} step ${op.index + 1}`;
    case "update_step":
      return `Updated ${op.section === "prepSteps" ? "prep" : "cooking"} step ${op.index + 1}`;
    case "move_step":
      return `Moved step from ${op.from.section === "prepSteps" ? "prep" : "cooking"} to ${op.to.section === "prepSteps" ? "prep" : "cooking"}`;
  }
}
