"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import type {
  Cuisine,
  Ingredient,
  Step,
  RecipeImage,
  MealType,
  CookStyle,
} from "@/types/recipe";

interface RecipeSnapshot {
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  prepSteps: Step[];
  cookingSteps: Step[];
  images: RecipeImage[];
  sourceUrl: string;
  sourceType: string;
  mealType?: MealType | null;
  cuisine?: Cuisine | null;
  cookStyle?: CookStyle | null;
  totalTimeMinutes?: number | null;
}

export default function SharedRecipeView({
  shareId,
  senderName,
  senderEmail,
  recipe,
  status,
  createdAt,
}: {
  shareId: string;
  senderName: string | null;
  senderEmail: string | null;
  recipe: RecipeSnapshot;
  status: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  async function handleAction(action: "accept" | "discard") {
    setProcessing(true);
    try {
      const res = await fetch(`/api/inbox/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setCurrentStatus(action === "accept" ? "accepted" : "discarded");
        if (action === "accept") {
          router.push("/");
        }
      }
    } finally {
      setProcessing(false);
    }
  }

  const heroUrl = recipe.images?.[0]?.blobUrl
    ? `/api/inbox/${shareId}/image`
    : (recipe.images?.[0]?.url ?? undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          From {senderName ?? senderEmail ?? "someone"} ·{" "}
          {new Date(createdAt).toLocaleDateString()}
        </p>
        {currentStatus !== "pending" && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              currentStatus === "accepted"
                ? "bg-green-50 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {currentStatus}
          </span>
        )}
      </div>

      <RecipeDisplay
        recipe={{
          title: recipe.title,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          prepSteps: recipe.prepSteps,
          cookingSteps: recipe.cookingSteps,
          mealType: recipe.mealType ?? null,
          cuisine: recipe.cuisine ?? null,
          cookStyle: recipe.cookStyle ?? null,
          totalTimeMinutes: recipe.totalTimeMinutes ?? null,
        }}
        sourceUrl={recipe.sourceUrl}
        heroImageUrl={heroUrl}
      >
        {currentStatus === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("accept")}
              disabled={processing}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processing ? "…" : "Accept"}
            </button>
            <button
              onClick={() => handleAction("discard")}
              disabled={processing}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Discard
            </button>
          </div>
        )}
      </RecipeDisplay>
    </div>
  );
}
