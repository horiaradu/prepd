"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ShareDialog } from "@/components/ShareDialog";
import ProgressBar from "@/components/ProgressBar";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import type { Recipe, ParsedRecipe } from "@/types/recipe";
import type { ChatMessage } from "@/lib/recipes";

export default function RecipeDetails({
  initialRecipe,
  initialMessages,
}: {
  initialRecipe: Recipe;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const recipeId = initialRecipe.id;
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
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
  const [showShare, setShowShare] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(() => {
    fetch(`/api/recipes/${recipeId}/chat`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      })
      .catch(() => {});
  }, [recipeId]);

  async function handleSendMessage(extraAction?: "cook") {
    if (!chatInput.trim() && !extraAction) return;

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
          setRecipe((prev) => ({
            ...prev,
            title: data.recipe.title,
            servings: data.recipe.servings,
            ingredients: data.recipe.ingredients,
            prepSteps: data.recipe.prepSteps,
            cookingSteps: data.recipe.cookingSteps,
          }));
          setChatInput("");
          loadMessages();
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
    setConfirmingDelete(false);
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/");
  }

  async function handleReparse() {
    if (!recipe.sourceUrl) return;
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
      setRecipe((prev) => ({
        ...prev,
        title: data.recipe.title,
        servings: data.recipe.servings,
        ingredients: data.recipe.ingredients,
        prepSteps: data.recipe.prepSteps,
        cookingSteps: data.recipe.cookingSteps,
      }));
    } finally {
      setReparsing(false);
      setReparseProgress(null);
    }
  }

  async function handleGenerateImage() {
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

      <ShareDialog
        open={showShare}
        recipeId={recipeId}
        onClose={() => setShowShare(false)}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

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
              title={showOriginal ? "View current" : "View original"}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              <span className="hidden sm:inline">
                {showOriginal ? "View current" : "View original"}
              </span>
            </button>
          )}
          {recipe.sourceUrl && recipe.sourceType !== "image" && (
            <button
              onClick={handleReparse}
              disabled={reparsing}
              title={reparsing ? "Re-parsing…" : "Re-parse"}
              className="inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-600 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>{reparsing ? "Re-parsing…" : "Re-parse"}</span>
            </button>
          )}
          {recipe.sourceUrl && recipe.sourceType !== "image" && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Source"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <span className="hidden sm:inline">Source</span>
            </a>
          )}
          {recipe.sourceType === "image" && (
            <a
              href={`/api/recipes/${recipe.id}/source-image`}
              target="_blank"
              rel="noopener noreferrer"
              title="Source"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <span className="hidden sm:inline">Source</span>
            </a>
          )}
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            title={
              generatingImage
                ? "Generating…"
                : heroImageOverride || recipe.images?.[0]?.url
                  ? "Regenerate image"
                  : "Generate image"
            }
            className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
            </svg>
            {generatingImage ? <span>Generating…</span> : <span>Image</span>}
          </button>
          <button
            onClick={() => setShowShare(true)}
            title="Share"
            className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={deleting}
            title={deleting ? "Deleting…" : "Delete"}
            className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 disabled:opacity-50 ml-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
            <span className="hidden sm:inline">
              {deleting ? "Deleting…" : "Delete"}
            </span>
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
