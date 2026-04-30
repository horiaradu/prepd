"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "collection" | "web" | "ideas";

interface Source {
  uri: string;
  title: string;
}

interface Sections {
  collection: string;
  web: string;
  ideas: string;
}

function parseSections(text: string): Sections {
  const sections: Sections = { collection: "", web: "", ideas: "" };
  const collectionMatch = text.match(
    /## From your collection\n([\s\S]*?)(?=\n## |$)/,
  );
  const webMatch = text.match(/## From the web\n([\s\S]*?)(?=\n## |$)/);
  const ideasMatch = text.match(/## My own ideas\n([\s\S]*?)(?=\n## |$)/);
  if (collectionMatch) sections.collection = collectionMatch[1].trim();
  if (webMatch) sections.web = webMatch[1].trim();
  if (ideasMatch) sections.ideas = ideasMatch[1].trim();
  return sections;
}

interface ParsedItem {
  title: string;
  description: string;
  urls: string[];
}

function extractItems(text: string): ParsedItem[] {
  const items: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (/^\d+\.\s|^[-*]\s/.test(line.trim())) {
      if (current) items.push(current.trim());
      current = line.replace(/^\s*(?:\d+\.\s|[-*]\s)/, "").trim();
    } else if (current && line.trim()) {
      current += "\n" + line.trim();
    }
  }
  if (current) items.push(current.trim());

  return items.map((block) => {
    const urls = [...new Set(block.match(/https?:\/\/[^\s)]+/g) ?? [])];
    const cleaned = block
      .replace(/https?:\/\/[^\s)]+/g, "")
      .replace(/[\[\]()]/g, "")
      .replace(/\*\*/g, "")
      .trim();
    const parts = cleaned.split(/[:–—-]\s*/, 2);
    const title = (parts[0] || "").replace(/^[-–—:,]+|[-–—:,]+$/g, "").trim();
    const description = (parts[1] || "")
      .replace(/^[-–—:,]+|[-–—:,]+$/g, "")
      .trim();
    return { title, description, urls };
  });
}

export default function SuggestPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("web");
  const [sections, setSections] = useState<Sections | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<
    Array<{ id: number; title: string }>
  >([]);
  const [history, setHistory] = useState<
    Array<{ role: "user" | "model"; content: string }>
  >([]);

  const busy = parsing !== null || generating !== null;

  async function handleSend() {
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/recipes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (res.ok) {
        const text: string = data.text ?? "";
        const newSources: Source[] = data.sources ?? [];
        const newRecipes: Array<{ id: number; title: string }> =
          data.recipes ?? [];
        setSections(parseSections(text));
        setSources(newSources);
        setSavedRecipes(newRecipes);
        setHistory([
          ...history,
          { role: "user", content: message },
          { role: "model", content: text },
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

  function renderItem(
    item: ParsedItem,
    index: number,
    action: "parse" | "generate",
  ) {
    const url =
      action === "parse"
        ? item.urls[0] ||
          sources.find((s) =>
            item.title
              .toLowerCase()
              .includes(s.title.toLowerCase().slice(0, 20)),
          )?.uri
        : undefined;
    const source = url
      ? sources.find((s) => s.uri === url || item.urls.includes(s.uri))
      : null;

    return (
      <div
        key={index}
        className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">
              {item.title || source?.title || "Recipe"}
            </p>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline break-all mt-1 inline-block"
              >
                {source?.title || new URL(url).hostname}
              </a>
            )}
          </div>
          {action === "parse" && url && (
            <button
              onClick={() => handleParseUrl(url)}
              disabled={busy}
              className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {parsing === url ? "Parsing…" : "Save recipe"}
            </button>
          )}
          {action === "generate" && (
            <button
              onClick={() => handleGenerate(item.title)}
              disabled={busy}
              className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {generating === item.title ? "Generating…" : "Generate recipe"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "collection", label: "Your collection" },
    { key: "web", label: "From the web" },
    { key: "ideas", label: "Original ideas" },
  ];

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

      <div className="mb-6">
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
            {sending ? "Searching…" : "Send"}
          </button>
        </div>
      </div>

      {sending && !sections && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">Searching for recipes…</p>
        </div>
      )}

      {!sending && !sections && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">
            Ask me for recipe ideas — I&apos;ll search the web and suggest based
            on your cooking history.
          </p>
        </div>
      )}

      {sections && (
        <div className="flex-1 flex flex-col">
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-green-600 border-b-2 border-green-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {activeTab === "collection" && (
              <>
                {sections.collection ? (
                  extractItems(sections.collection).length > 0 ? (
                    extractItems(sections.collection).map((item, i) => {
                      const match = savedRecipes.find(
                        (r) =>
                          r.title.toLowerCase() === item.title.toLowerCase(),
                      );
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {match && (
                              <Link
                                href={`/recipe/${match.id}`}
                                className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                              >
                                View recipe
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {sections.collection}
                    </div>
                  )
                ) : (
                  <p className="text-gray-400 text-sm">
                    No suggestions from your collection.
                  </p>
                )}
              </>
            )}

            {activeTab === "web" && (
              <>
                {(() => {
                  const items = sections.web ? extractItems(sections.web) : [];
                  const enriched = items.map((item, i) => {
                    if (item.urls.length > 0) return item;
                    const source = sources[i] ?? null;
                    if (source) {
                      return { ...item, urls: [source.uri] };
                    }
                    return item;
                  });
                  return enriched.length > 0 ? (
                    enriched.map((item, i) => renderItem(item, i, "parse"))
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No web recipes found.
                    </p>
                  );
                })()}
              </>
            )}

            {activeTab === "ideas" && (
              <>
                {sections.ideas ? (
                  extractItems(sections.ideas).length > 0 ? (
                    extractItems(sections.ideas).map((item, i) =>
                      renderItem(item, i, "generate"),
                    )
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {sections.ideas}
                    </div>
                  )
                ) : (
                  <p className="text-gray-400 text-sm">
                    No original ideas suggested.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
