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
  const [generating, setGenerating] = useState<string | null>(null);
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
        let content = data.text ?? "";
        const sources: Array<{ uri: string; title: string }> =
          data.sources ?? [];
        const inlineUrls = new Set(content.match(/https?:\/\/[^\s)]+/g) ?? []);
        const missingLinks = sources.filter((s) => !inlineUrls.has(s.uri));
        if (missingLinks.length > 0) {
          content +=
            "\n\nSources:\n" +
            missingLinks
              .map((s) => `- ${s.title || s.uri}: ${s.uri}`)
              .join("\n");
        }
        setMessages([...updatedMessages, { role: "model", content }]);
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

  async function handleGenerate(description: string) {
    setGenerating(description);
    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/recipe/${data.id}`);
      }
    } finally {
      setGenerating(null);
    }
  }

  function extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s)]+/g;
    return [...new Set(text.match(urlRegex) ?? [])];
  }

  function extractOriginalIdeas(content: string): string[] {
    const ideasMatch = content.match(/## My own ideas\n([\s\S]*?)(?=\n## |$)/);
    if (!ideasMatch) return [];
    const lines = ideasMatch[1].trim().split("\n");
    return lines
      .filter((line) => /^\d+\.\s|^[-*]\s/.test(line.trim()))
      .map((line) => line.replace(/^\d+\.\s|^[-*]\s/, "").trim())
      .filter(Boolean);
  }

  function renderMessageContent(content: string) {
    const urls = extractUrls(content);
    const originalIdeas = extractOriginalIdeas(content);
    const parts = content.split(/(https?:\/\/[^\s)]+)/g);

    return (
      <div>
        <p className="whitespace-pre-wrap text-gray-700">
          {parts.map((part, i) =>
            urls.includes(part) ? (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline break-all"
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
                disabled={parsing !== null || generating !== null}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                {parsing === url ? "Parsing…" : "Parse this recipe"}
              </button>
            ))}
          </div>
        )}
        {originalIdeas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {originalIdeas.map((idea) => (
              <button
                key={idea}
                onClick={() => handleGenerate(idea)}
                disabled={parsing !== null || generating !== null}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                {generating === idea
                  ? "Generating…"
                  : `Generate: ${idea.slice(0, 40)}${idea.length > 40 ? "…" : ""}`}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          Recipe suggestions
        </h1>
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
                ? "bg-green-50 border border-green-200 ml-12"
                : "bg-gray-50 border border-gray-100 mr-12"
            }`}
          >
            {msg.role === "model" ? (
              renderMessageContent(msg.content)
            ) : (
              <p className="text-gray-700">{msg.content}</p>
            )}
          </div>
        ))}
        {sending && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mr-12">
            <p className="text-gray-400 animate-pulse">Thinking…</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you in the mood for?"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-colors"
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
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
