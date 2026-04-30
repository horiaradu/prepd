"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function SuggestPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const message = input.trim();
    if (!message || sending) return;

    const userMessage: Message = { role: "user", content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/recipes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([
          ...updatedMessages,
          { role: "model", content: data.text },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleParseUrl(url: string) {
    setParsing(url);
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/recipe/${data.id}`);
      }
    } finally {
      setParsing(null);
    }
  }

  function extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s)]+/g;
    return [...new Set(text.match(urlRegex) ?? [])];
  }

  function renderMessageContent(content: string) {
    const urls = extractUrls(content);
    const parts = content.split(/(https?:\/\/[^\s)]+)/g);

    return (
      <div>
        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {parts.map((part, i) =>
            urls.includes(part) ? (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>
        {urls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {urls.map((url) => (
              <button
                key={url}
                onClick={() => handleParseUrl(url)}
                disabled={parsing !== null}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
              >
                {parsing === url ? "Parsing…" : "Parse this recipe"}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold">Recipe suggestions</h1>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-20">
            Ask me for recipe ideas — I can search the web and suggest based on
            your cooking history.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-4 py-3 ${
              msg.role === "user"
                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ml-12"
                : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-12"
            }`}
          >
            {msg.role === "model" ? (
              renderMessageContent(msg.content)
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{msg.content}</p>
            )}
          </div>
        ))}
        {sending && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mr-12">
            <p className="text-gray-400 animate-pulse">Thinking…</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you in the mood for?"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
