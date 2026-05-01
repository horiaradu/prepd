"use client";

import { useState, useEffect, useRef } from "react";

export function ShareDialog({
  open,
  recipeId,
  onClose,
}: {
  open: boolean;
  recipeId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setSent(false);
      setError(null);
      fetch("/api/recipes/recent-emails")
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch(() => {});
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  async function handleSend() {
    if (!email.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to share");
        return;
      }

      setSent(true);
    } catch {
      setError("Failed to share");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const filtered = suggestions.filter(
    (s) => s.includes(email.toLowerCase()) && s !== email.toLowerCase(),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Share recipe</h3>

        {sent ? (
          <div className="space-y-4">
            <p className="text-green-600 text-sm">
              Recipe shared with {email}!
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Recipient email"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
              />
              {email && filtered.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                  {filtered.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEmail(s)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !email.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
