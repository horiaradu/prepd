"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecipeDisplay } from "@/components/RecipeDisplay";
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
    if (!recipe || !confirm("Delete this recipe?")) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/");
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <p className="text-red-500">{error}</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 block">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
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
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back
        </Link>
        <div className="flex items-center gap-4">
          {hasOriginal && messages.length > 0 && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showOriginal ? "View current" : "View original"}
            </button>
          )}
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Source
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {showOriginal && (
        <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          Viewing the original recipe as first parsed
        </div>
      )}

      <RecipeDisplay recipe={displayRecipe} sourceUrl={recipe.sourceUrl} />

      {!showOriginal && (
        <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
          {messages.length > 0 && (
            <div className="mb-6 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span className="font-medium text-xs text-gray-500 uppercase">
                    {msg.role === "user" ? "You" : "Prepd"}
                  </span>
                  <p className="mt-0.5 text-gray-700 dark:text-gray-300">
                    {msg.content}
                  </p>
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Update recipe
              </button>
              <button
                onClick={() => handleSendMessage("cook")}
                disabled={sending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
