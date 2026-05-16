"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ShareDialog } from "@/components/ShareDialog";
import ProgressBar from "@/components/ProgressBar";
import {
  HistoryIcon,
  RotateCcwIcon,
  ExternalLinkIcon,
  SparklesIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import { applyOperations } from "@/lib/recipe-operations";
import type { Recipe, ParsedRecipe } from "@/types/recipe";
import type { ChatMessage } from "@/lib/recipes";
import { useLanguage } from "@/context/LanguageContext";
import {
  trackChatMessageSent,
  trackChatChangesApplied,
  trackChatChangesDiscarded,
  trackRecipeReparsed,
  trackImageGenerated,
} from "@/lib/analytics-events";

export default function RecipeDetails({
  initialRecipe,
  initialMessages,
}: {
  initialRecipe: Recipe;
  initialMessages: ChatMessage[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const recipeId = initialRecipe.id;
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState(false);
  const [undoing, setUndoing] = useState(false);
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

  // Pending edit state — restored from DB on mount if a pending message exists
  const initialPending = initialMessages.find(
    (m) => m.role === "assistant" && m.status === "pending",
  );
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(
    initialPending?.id ?? null,
  );
  const [previewRecipe, setPreviewRecipe] = useState<ParsedRecipe | null>(
    initialPending?.operations && initialPending?.previousRecipe
      ? applyOperations(
          initialPending.previousRecipe,
          initialPending.operations,
        )
      : null,
  );

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

  function clearPending() {
    setPendingMessageId(null);
    setPreviewRecipe(null);
  }

  async function handleSendMessage(extraAction?: "cook") {
    if (!chatInput.trim() && !extraAction) return;

    const message = chatInput.trim();
    setSending(true);
    setError(null);

    try {
      if (extraAction === "cook") {
        await fetch(`/api/recipes/${recipeId}/cook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tweaks: message || null }),
        });
        // If no message to tweak, cook is complete — go home
        if (!message) {
          router.push("/");
          return;
        }
        // With a message, fall through into the normal tweak preview flow
      }

      if (message) {
        const res = await fetch(`/api/recipes/${recipeId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? t.somethingWentWrong);
          return;
        }
        setPendingMessageId(data.messageId);
        setPreviewRecipe(data.preview);
        loadMessages();
        trackChatMessageSent({ recipeId });
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    } finally {
      setSending(false);
    }
  }

  async function handleApply() {
    if (!pendingMessageId) return;
    setApplying(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/recipes/${recipeId}/chat/${pendingMessageId}/apply`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t.failedToApply);
        return;
      }
      setRecipe((prev) => ({ ...prev, ...data.recipe }));
      setChatInput("");
      clearPending();
      loadMessages();
      trackChatChangesApplied({ recipeId });
    } finally {
      setApplying(false);
    }
  }

  async function handleDiscard() {
    if (!pendingMessageId) return;

    const res = await fetch(
      `/api/recipes/${recipeId}/chat/${pendingMessageId}/discard`,
      { method: "POST" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.failedToDiscard);
      return;
    }
    setChatInput("");
    clearPending();
    loadMessages();
    trackChatChangesDiscarded({ recipeId });
  }

  async function handleUndo() {
    setUndoing(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/chat/undo`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t.nothingToUndo);
        return;
      }
      setRecipe((prev) => ({ ...prev, ...data.recipe }));
      loadMessages();
    } finally {
      setUndoing(false);
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
      trackRecipeReparsed({ recipeId });
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t.failedToGenerateImage);
        return;
      }
      setHeroImageOverride(data.imageUrl);
      trackImageGenerated({ recipeId });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failedToGenerateImage);
    } finally {
      setGeneratingImage(false);
    }
  }

  const hasOriginal = recipe.originalRecipe != null;

  // Show preview when pending, original when toggled, otherwise current
  const displayRecipe: ParsedRecipe =
    !showOriginal && previewRecipe
      ? previewRecipe
      : showOriginal && recipe.originalRecipe
        ? recipe.originalRecipe
        : {
            title: recipe.title,
            servings: recipe.servings,
            ingredients: recipe.ingredients,
            prepSteps: recipe.prepSteps,
            cookingSteps: recipe.cookingSteps,
          };

  // Most recent applied assistant message with stored state = undoable
  const undoableMessage =
    [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          m.status === "applied" &&
          m.previousRecipe !== null,
      ) ?? null;

  const hasPending = pendingMessageId !== null;

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <ConfirmDialog
        open={confirmingDelete}
        title={t.deleteRecipeTitle}
        message={t.deleteRecipeMessage}
        confirmLabel={t.delete}
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
          {t.viewingOriginal}
        </div>
      )}

      {previewRecipe && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {t.showingPreview}
        </div>
      )}

      <RecipeDisplay
        recipe={displayRecipe}
        sourceUrl={recipe.sourceUrl}
        heroImageUrl={heroImageOverride ?? recipe.images?.[0]?.url}
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {hasOriginal && messages.length > 0 && !hasPending && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              title={showOriginal ? t.viewCurrent : t.viewOriginal}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <HistoryIcon />
              <span className="hidden sm:inline">
                {showOriginal ? t.viewCurrent : t.viewOriginal}
              </span>
            </button>
          )}
          {recipe.sourceUrl && recipe.sourceType !== "image" && !hasPending && (
            <button
              onClick={handleReparse}
              disabled={reparsing}
              title={reparsing ? t.reparsing : t.reparse}
              className="inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-600 disabled:opacity-50"
            >
              <RotateCcwIcon />
              <span>{reparsing ? t.reparsing : t.reparse}</span>
            </button>
          )}
          {recipe.sourceUrl && recipe.sourceType !== "image" && !hasPending && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={t.source}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <ExternalLinkIcon />
              <span className="hidden sm:inline">{t.source}</span>
            </a>
          )}
          {recipe.sourceType === "image" && !hasPending && (
            <a
              href={`/api/recipes/${recipe.id}/source-image`}
              target="_blank"
              rel="noopener noreferrer"
              title={t.source}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <ExternalLinkIcon />
              <span className="hidden sm:inline">{t.source}</span>
            </a>
          )}
          {!hasPending && (
            <button
              onClick={handleGenerateImage}
              disabled={generatingImage}
              title={
                generatingImage
                  ? t.generating
                  : heroImageOverride || recipe.images?.[0]?.url
                    ? t.regenerateImage
                    : t.generateImage
              }
              className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <SparklesIcon />
              {generatingImage ? (
                <span>{t.generating}</span>
              ) : (
                <span>{t.image}</span>
              )}
            </button>
          )}
          {!hasPending && (
            <button
              onClick={() => setShowShare(true)}
              title={t.share}
              className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700"
            >
              <ShareIcon />
              <span className="hidden sm:inline">{t.share}</span>
            </button>
          )}
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={deleting || hasPending}
            title={deleting ? t.deleting : t.delete}
            className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 disabled:opacity-50 ml-auto"
          >
            <TrashIcon />
            <span className="hidden sm:inline">
              {deleting ? t.deleting : t.delete}
            </span>
          </button>
        </div>
      </RecipeDisplay>

      {!showOriginal && (
        <div className="mt-10 border-t border-gray-100 pt-6">
          {messages.length > 0 && (
            <div className="mb-6 space-y-3">
              {messages.map((msg) => {
                const isReverted =
                  msg.status === "reverted" || msg.status === "discarded";
                const isUndoable =
                  msg.role === "assistant" &&
                  msg.status === "applied" &&
                  msg.id === undoableMessage?.id;
                const isPending = msg.status === "pending";

                return (
                  <div
                    key={msg.id}
                    className={`text-sm rounded-lg px-3 py-2 ${
                      isPending
                        ? "bg-green-50 border border-green-200"
                        : msg.role === "user"
                          ? "bg-gray-50 border border-gray-100"
                          : "bg-white border border-gray-100"
                    } ${isReverted ? "opacity-40" : ""}`}
                  >
                    <p
                      className={`text-gray-700 ${isReverted ? "line-through" : ""}`}
                    >
                      {msg.content}
                    </p>
                    {isUndoable && (
                      <button
                        onClick={handleUndo}
                        disabled={undoing}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        {undoing ? t.undoing : t.undo}
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {hasPending ? (
            <div className="space-y-3">
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {applying ? t.applying : t.applyChanges}
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={applying}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {t.discard}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.tweakPlaceholder}
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
                  {sending ? t.thinking : t.updateRecipe}
                </button>
                <button
                  onClick={() => handleSendMessage("cook")}
                  disabled={sending}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {chatInput.trim() ? t.iCookedThisUpdate : t.iCookedThis}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
