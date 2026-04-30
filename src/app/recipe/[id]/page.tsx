"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ProgressBar from "@/components/ProgressBar";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import type { Recipe, ParsedRecipe } from "@/types/recipe";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reparseProgress, setReparseProgress] = useState<ProgressEvent | null>(
    null,
  );
  const [generatingImage, setGeneratingImage] = useState(false);
  const [heroImageOverride, setHeroImageOverride] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(({ id }) => setRecipeId(id));
  }, [params]);

  const loadMessages = useCallback((id: string) => {
    fetch(`/api/recipes/${id}/chat`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recipeId) return;
    fetch(`/api/recipes/${recipeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Recipe not found");
        return res.json();
      })
      .then((data) => setRecipe(data))
      .catch((err) => setError(err.message));
    loadMessages(recipeId);
  }, [recipeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(extraAction?: "cook") {
    if (!recipeId || (!chatInput.trim() && !extraAction)) return;

    const message = chatInput.trim();
    setSending(true);

    try {
      if (extraAction === "cook") {
        await fetch(`/api/recipes/${recipeId}/cook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tweaks: message || null }),
        });
      }

      if (message) {
        const res = await fetch(`/api/recipes/${recipeId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (res.ok) {
          setRecipe((prev) =>
            prev
              ? {
                  ...prev,
                  title: data.recipe.title,
                  servings: data.recipe.servings,
                  ingredients: data.recipe.ingredients,
                  prepSteps: data.recipe.prepSteps,
                  cookingSteps: data.recipe.cookingSteps,
                }
              : prev,
          );
          setChatInput("");
          loadMessages(recipeId);
        }
      } else {
        setChatInput("");
      }

      if (extraAction === "cook") {
        router.push("/");
        return;
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!recipe) return;
    setConfirmingDelete(false);
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/");
  }

  async function handleReparse() {
    if (!recipe?.sourceUrl || !recipeId) return;
    setReparsing(true);
    setReparseProgress(null);
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipe.sourceUrl, replaceId: recipeId }),
      });
      if (!res.ok || !res.body) return;
      const data = await readProgressStream<{ recipe: ParsedRecipe }>(
        res,
        setReparseProgress,
      );
      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              title: data.recipe.title,
              servings: data.recipe.servings,
              ingredients: data.recipe.ingredients,
              prepSteps: data.recipe.prepSteps,
              cookingSteps: data.recipe.cookingSteps,
            }
          : prev,
      );
    } finally {
      setReparsing(false);
      setReparseProgress(null);
    }
  }

  async function handleGenerateImage() {
    if (!recipeId) return;
    setGeneratingImage(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/generate-image`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate image");
        return;
      }
      setHeroImageOverride(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 sm:p-8 max-w-3xl w-full mx-auto">
        <p className="text-red-500">{error}</p>
        <Link
          href="/"
          className="text-green-600 hover:text-green-700 mt-4 block text-sm font-medium"
        >
          ← Back to recipes
        </Link>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen p-6 sm:p-8 max-w-3xl w-full mx-auto">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const hasOriginal = recipe.originalRecipe != null;
  const displayRecipe: ParsedRecipe =
    showOriginal && recipe.originalRecipe
      ? recipe.originalRecipe
      : {
          title: recipe.title,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          prepSteps: recipe.prepSteps,
          cookingSteps: recipe.cookingSteps,
        };

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this recipe?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      {reparseProgress && (
        <div className="mb-4">
          <ProgressBar
            step={reparseProgress.step}
            progress={reparseProgress.progress}
          />
        </div>
      )}

      {showOriginal && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Viewing the original recipe as first parsed
        </div>
      )}

      <RecipeDisplay
        recipe={displayRecipe}
        sourceUrl={recipe.sourceUrl}
        heroImageUrl={heroImageOverride ?? recipe.images?.[0]?.url}
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {hasOriginal && messages.length > 0 && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              {showOriginal ? "View current" : "View original"}
            </button>
          )}
          {recipe.sourceUrl && recipe.sourceType !== "image" && (
            <button
              onClick={handleReparse}
              disabled={reparsing}
              className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {reparsing ? "Re-parsing…" : "Re-parse"}
            </button>
          )}
          {recipe.sourceUrl && recipe.sourceType !== "image" && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Source
            </a>
          )}
          {recipe.sourceType === "image" && (
            <a
              href={`/api/recipes/${recipe.id}/source-image`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Source
            </a>
          )}
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            {generatingImage
              ? "Generating…"
              : heroImageOverride || recipe.images?.[0]?.url
                ? "Regenerate image"
                : "Generate image"}
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={deleting}
            className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50 ml-auto"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </RecipeDisplay>

      {!showOriginal && (
        <div className="mt-10 border-t border-gray-100 pt-6">
          {messages.length > 0 && (
            <div className="mb-6 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <span className="font-medium text-xs text-gray-500 uppercase">
                    {msg.role === "user" ? "You" : "Prepd"}
                  </span>
                  <p className="mt-0.5 text-gray-700">{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="space-y-3">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tweak the recipe… e.g. 'use coconut milk instead of cream' or 'double the garlic'"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
              rows={2}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !chatInput.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Update recipe
              </button>
              <button
                onClick={() => handleSendMessage("cook")}
                disabled={sending}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                {chatInput.trim() ? "I cooked this + update" : "I cooked this"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
