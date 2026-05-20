"use client";

import { useEffect, useRef, useState } from "react";
import {
  COOK_STYLES,
  CUISINES,
  MEAL_TYPES,
  type Cuisine,
  type CookStyle,
  type MealType,
  type RecipeTaxonomy,
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

export function TagEditor({
  recipeId,
  taxonomy,
  onChange,
}: {
  recipeId: string;
  taxonomy: RecipeTaxonomy;
  onChange: (next: RecipeTaxonomy) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<"meal" | "cuisine" | "cook" | "time" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  async function persist(patch: Partial<RecipeTaxonomy>) {
    const optimistic: RecipeTaxonomy = { ...taxonomy, ...patch };
    onChange(optimistic);
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        onChange(taxonomy);
        return;
      }
      const updated = (await res.json()) as RecipeTaxonomy;
      onChange(updated);
    } catch {
      onChange(taxonomy);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-xs transition-opacity ${
        saving ? "opacity-60" : ""
      }`}
    >
      <ChipWithPopover
        open={open === "meal"}
        onOpenChange={(v) => setOpen(v ? "meal" : null)}
        chip={
          <>
            <span className="text-gray-400">{t.filterMealType}:</span>
            <span className="ml-1 font-medium">
              {taxonomy.mealType ? mealLabel(taxonomy.mealType, t) : t.tagUnset}
            </span>
          </>
        }
        filled={taxonomy.mealType != null}
      >
        <OptionList
          current={taxonomy.mealType}
          options={MEAL_TYPES.map((m) => ({
            value: m,
            label: mealLabel(m, t),
          }))}
          onPick={(v) => {
            persist({ mealType: v });
            setOpen(null);
          }}
          onClear={
            taxonomy.mealType != null
              ? () => {
                  persist({ mealType: null });
                  setOpen(null);
                }
              : undefined
          }
          clearLabel={t.tagClear}
        />
      </ChipWithPopover>

      <ChipWithPopover
        open={open === "cuisine"}
        onOpenChange={(v) => setOpen(v ? "cuisine" : null)}
        chip={
          <>
            <span className="text-gray-400">{t.filterCuisine}:</span>
            <span className="ml-1 font-medium">
              {taxonomy.cuisine ? cuisineLabel(taxonomy.cuisine, t) : t.tagUnset}
            </span>
          </>
        }
        filled={taxonomy.cuisine != null}
      >
        <OptionList
          current={taxonomy.cuisine}
          options={CUISINES.map((c) => ({ value: c, label: cuisineLabel(c, t) }))}
          onPick={(v) => {
            persist({ cuisine: v });
            setOpen(null);
          }}
          onClear={
            taxonomy.cuisine != null
              ? () => {
                  persist({ cuisine: null });
                  setOpen(null);
                }
              : undefined
          }
          clearLabel={t.tagClear}
        />
      </ChipWithPopover>

      <ChipWithPopover
        open={open === "cook"}
        onOpenChange={(v) => setOpen(v ? "cook" : null)}
        chip={
          <>
            <span className="text-gray-400">{t.filterCookStyle}:</span>
            <span className="ml-1 font-medium">
              {taxonomy.cookStyle
                ? cookStyleLabel(taxonomy.cookStyle, t)
                : t.tagUnset}
            </span>
          </>
        }
        filled={taxonomy.cookStyle != null}
      >
        <OptionList
          current={taxonomy.cookStyle}
          options={COOK_STYLES.map((s) => ({
            value: s,
            label: cookStyleLabel(s, t),
          }))}
          onPick={(v) => {
            persist({ cookStyle: v });
            setOpen(null);
          }}
          onClear={
            taxonomy.cookStyle != null
              ? () => {
                  persist({ cookStyle: null });
                  setOpen(null);
                }
              : undefined
          }
          clearLabel={t.tagClear}
        />
      </ChipWithPopover>

      <ChipWithPopover
        open={open === "time"}
        onOpenChange={(v) => setOpen(v ? "time" : null)}
        chip={
          <>
            <span className="text-gray-400">{t.filterTime}:</span>
            <span className="ml-1 font-medium">
              {taxonomy.totalTimeMinutes != null
                ? t.timeMinutes.replace(
                    "{min}",
                    String(taxonomy.totalTimeMinutes),
                  )
                : t.tagUnset}
            </span>
          </>
        }
        filled={taxonomy.totalTimeMinutes != null}
      >
        <TimeInput
          current={taxonomy.totalTimeMinutes}
          minutesUnit={t.tagMinutesUnit}
          onSubmit={(v) => {
            persist({ totalTimeMinutes: v });
            setOpen(null);
          }}
          onClear={
            taxonomy.totalTimeMinutes != null
              ? () => {
                  persist({ totalTimeMinutes: null });
                  setOpen(null);
                }
              : undefined
          }
          clearLabel={t.tagClear}
        />
      </ChipWithPopover>
    </div>
  );
}

function ChipWithPopover({
  open,
  onOpenChange,
  chip,
  filled,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chip: React.ReactNode;
  filled: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`inline-flex items-center border rounded-full px-2.5 py-0.5 transition-colors ${
          filled
            ? "border-green-200 bg-green-50 text-green-700 hover:border-green-300"
            : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-400"
        }`}
      >
        {chip}
      </button>

      {/* Desktop: inline popover */}
      {open && (
        <div className="hidden sm:block absolute z-20 left-0 mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg p-1">
          {children}
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {open && (
        <div className="sm:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => onOpenChange(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-safe">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="p-3">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionList<T extends string>({
  current,
  options,
  onPick,
  onClear,
  clearLabel,
}: {
  current: T | null;
  options: { value: T; label: string }[];
  onPick: (value: T) => void;
  onClear?: () => void;
  clearLabel: string;
}) {
  return (
    <div className="max-h-72 overflow-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onPick(opt.value)}
          className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
            opt.value === current
              ? "bg-green-50 text-green-700 font-medium"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
      {onClear && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            onClick={onClear}
            className="w-full text-left px-3 py-1.5 rounded text-sm text-gray-500 hover:bg-gray-50"
          >
            {clearLabel}
          </button>
        </>
      )}
    </div>
  );
}


function TimeInput({
  current,
  minutesUnit,
  onSubmit,
  onClear,
  clearLabel,
}: {
  current: number | null;
  minutesUnit: string;
  onSubmit: (value: number) => void;
  onClear?: () => void;
  clearLabel: string;
}) {
  const [value, setValue] = useState(current != null ? String(current) : "");

  function submit() {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    onSubmit(n);
  }

  return (
    <div className="p-1 w-44">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          min={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-gray-500">{minutesUnit}</span>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="w-full text-left mt-1 px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-50"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
