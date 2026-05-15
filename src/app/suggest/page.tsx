"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { readProgressStream, type ProgressEvent } from "@/lib/progress-stream";
import { useLanguage } from "@/context/LanguageContext";

type Tab = "collection" | "web" | "ideas";

interface Source {
  uri: string;
  title: string;
}

interface Support {
  startIndex: number;
  endIndex: number;
  chunkIndices: number[];
}

interface Sections {
  collection: string;
  web: string;
  ideas: string;
  webOffset: number;
}

function parseSections(text: string): Sections {
  const sections: Sections = {
    collection: "",
    web: "",
    ideas: "",
    webOffset: 0,
  };
  const collectionMatch = text.match(
    /## From your collection\n([\s\S]*?)(?=\n## |$)/,
  );
  const webMatch = text.match(/## From the web\n([\s\S]*?)(?=\n## |$)/);
  const ideasMatch = text.match(/## My own ideas\n([\s\S]*?)(?=\n## |$)/);
  if (collectionMatch) sections.collection = collectionMatch[1].trim();
  if (webMatch) {
    sections.web = webMatch[1].trim();
    // offset of the captured group within fullText (skip header line)
    sections.webOffset = (webMatch.index ?? 0) + "## From the web\n".length;
  }
  if (ideasMatch) sections.ideas = ideasMatch[1].trim();
  return sections;
}

interface ParsedItem {
  title: string;
  description: string;
  urls: string[];
  startIndex?: number;
  endIndex?: number;
}

function extractItems(text: string, baseOffset = 0): ParsedItem[] {
  const items: Array<{ block: string; start: number; end: number }> = [];
  let current: { block: string; start: number; end: number } | null = null;
  let cursor = 0;

  for (const line of text.split("\n")) {
    const lineLength = line.length + 1; // include the \n
    const trimmed = line.trim();
    if (/^\d+\.\s|^[-*]\s/.test(trimmed)) {
      if (current) items.push(current);
      current = {
        block: line.replace(/^\s*(?:\d+\.\s|[-*]\s)/, "").trim(),
        start: cursor,
        end: cursor + lineLength,
      };
    } else if (current && trimmed) {
      current.block += "\n" + trimmed;
      current.end = cursor + lineLength;
    }
    cursor += lineLength;
  }
  if (current) items.push(current);

  return items.map(({ block, start, end }) => {
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
    return {
      title,
      description,
      urls,
      startIndex: baseOffset + start,
      endIndex: baseOffset + end,
    };
  });
}

// Gemini grounding indices are byte offsets in UTF-8. Convert to char offsets.
function buildByteToCharMap(text: string): number[] {
  const map: number[] = [];
  let byteIdx = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    let len = 1;
    if (code >= 0xd800 && code <= 0xdbff) {
      // surrogate pair = 4 bytes, advance i by 1 extra
      len = 4;
      i++;
    } else if (code >= 0x800) len = 3;
    else if (code >= 0x80) len = 2;
    for (let b = 0; b < len; b++) map[byteIdx + b] = i;
    byteIdx += len;
  }
  map[byteIdx] = text.length;
  return map;
}

function findSourcesForItem(
  item: ParsedItem,
  supports: Support[],
  sources: Source[],
  byteToChar: number[],
): Source[] {
  if (item.startIndex === undefined || item.endIndex === undefined) return [];
  const chunkIds = new Set<number>();
  for (const support of supports) {
    const segStart = byteToChar[support.startIndex] ?? support.startIndex;
    const segEnd = byteToChar[support.endIndex] ?? support.endIndex;
    // overlap?
    if (segStart < item.endIndex && segEnd > item.startIndex) {
      for (const idx of support.chunkIndices) chunkIds.add(idx);
    }
  }
  return [...chunkIds]
    .map((idx) => sources[idx])
    .filter((s): s is Source => Boolean(s));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkifyRecipeTitles(
  text: string,
  recipes: Array<{ id: number; title: string }>,
): React.ReactNode[] {
  if (recipes.length === 0) return [text];
  // Sort by length desc so longer titles match first.
  const sorted = [...recipes].sort((a, b) => b.title.length - a.title.length);
  const pattern = new RegExp(
    `"?(${sorted.map((r) => escapeRegex(r.title)).join("|")})"?`,
    "gi",
  );

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const matchStart = match.index ?? 0;
    const matchedText = match[0];
    const titleText = match[1];
    const recipe = sorted.find(
      (r) => r.title.toLowerCase() === titleText.toLowerCase(),
    );
    if (!recipe) continue;
    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart));
    }
    nodes.push(
      <Link
        key={key++}
        href={`/recipe/${recipe.id}`}
        className="text-green-600 hover:underline font-medium"
      >
        {matchedText}
      </Link>,
    );
    lastIndex = matchStart + matchedText.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default function SuggestPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("web");
  const [sections, setSections] = useState<Sections | null>(null);
  const [fullText, setFullText] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [supports, setSupports] = useState<Support[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<
    Array<{ id: number; title: string }>
  >([]);
  const [history, setHistory] = useState<
    Array<{ role: "user" | "model"; content: string }>
  >([]);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);

  const busy = parsing !== null || generating !== null;

  async function handleSend() {
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setSections(null);
    setSources([]);
    setSupports([]);
    setFullText("");

    try {
      const res = await fetch("/api/recipes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);
            if (event.type === "recipes") {
              setSavedRecipes(event.recipes);
            } else if (event.type === "text") {
              accumulated += event.text;
              setFullText(accumulated);
              setSections(parseSections(accumulated));
            } else if (event.type === "done") {
              setSources(event.sources ?? []);
              setSupports(event.supports ?? []);
            }
          } catch {
            // skip malformed events
          }
        }
      }

      setHistory([
        ...history,
        { role: "user", content: message },
        { role: "model", content: accumulated },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleParseUrl(url: string) {
    setParsing(url);
    setProgress(null);
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok || !res.body) return;
      const data = await readProgressStream<{ id: string }>(res, setProgress);
      router.push(`/recipe/${data.id}`);
    } finally {
      setParsing(null);
      setProgress(null);
    }
  }

  async function handleGenerate(description: string) {
    setGenerating(description);
    setProgress(null);
    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok || !res.body) return;
      const data = await readProgressStream<{ id: string }>(res, setProgress);
      router.push(`/recipe/${data.id}`);
    } finally {
      setGenerating(null);
      setProgress(null);
    }
  }

  function renderItem(
    item: ParsedItem,
    index: number,
    action: "parse" | "generate",
    matchedSource?: Source,
  ) {
    const url =
      action === "parse" ? item.urls[0] || matchedSource?.uri : undefined;
    const source = url
      ? (sources.find((s) => s.uri === url) ?? matchedSource ?? null)
      : null;

    return (
      <div
        key={index}
        className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">
              {item.title || source?.title || t.recipeFallbackTitle}
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
              {parsing === url ? t.parsing : t.saveRecipe}
            </button>
          )}
          {action === "generate" && (
            <button
              onClick={() => handleGenerate(item.title)}
              disabled={busy}
              className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {generating === item.title ? t.generating : t.generateRecipeSuggest}
            </button>
          )}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "collection", label: t.yourCollection },
    { key: "web", label: t.fromTheWeb },
    { key: "ideas", label: t.originalIdeas },
  ];

  return (
    <div className="flex flex-col max-w-3xl w-full mx-auto p-6 sm:p-8">
      <h1 className="text-lg font-semibold tracking-tight mb-6">
        {t.recipeSuggestions}
      </h1>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.whatMoodFor}
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
            {sending ? t.searching : t.send}
          </button>
        </div>
      </div>

      {progress && (
        <div className="mb-6">
          <ProgressBar step={progress.step} progress={progress.progress} />
        </div>
      )}

      {sending && !sections && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">{t.searchingForRecipes}</p>
        </div>
      )}

      {!sending && !sections && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">
            {t.askForRecipeIdeas}
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
                      const normalize = (s: string) =>
                        s
                          .toLowerCase()
                          .replace(/[^\w\s]/g, "")
                          .trim();
                      const itemNorm = normalize(item.title);
                      const match = savedRecipes.find((r) => {
                        const rNorm = normalize(r.title);
                        return (
                          rNorm === itemNorm ||
                          rNorm.includes(itemNorm) ||
                          itemNorm.includes(rNorm)
                        );
                      });

                      const content = (
                        <>
                          <p className="text-sm font-medium text-gray-800">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </>
                      );

                      const className =
                        "block rounded-lg border border-gray-100 bg-gray-50 px-4 py-3" +
                        (match
                          ? " hover:border-green-600 transition-colors"
                          : "");

                      return match ? (
                        <Link
                          key={i}
                          href={`/recipe/${match.id}`}
                          className={className}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div key={i} className={className}>
                          {content}
                        </div>
                      );
                    })
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {linkifyRecipeTitles(sections.collection, savedRecipes)}
                    </div>
                  )
                ) : (
                  !sending && (
                    <p className="text-gray-400 text-sm">
                      {t.noSuggestionsFromCollection}
                    </p>
                  )
                )}
              </>
            )}

            {activeTab === "web" && (
              <>
                {(() => {
                  const items = sections.web
                    ? extractItems(sections.web, sections.webOffset)
                    : [];
                  const byteToChar = buildByteToCharMap(fullText);
                  const rendered = items
                    .map((item) => {
                      const matched = findSourcesForItem(
                        item,
                        supports,
                        sources,
                        byteToChar,
                      );
                      return { item, source: matched[0] };
                    })
                    .filter(({ item, source }) => item.urls[0] || source);
                  return rendered.length > 0 ? (
                    rendered.map(({ item, source }, i) =>
                      renderItem(item, i, "parse", source),
                    )
                  ) : !sending ? (
                    <p className="text-gray-400 text-sm">
                      {t.noWebRecipes}
                    </p>
                  ) : null;
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
                  !sending && (
                    <p className="text-gray-400 text-sm">
                      {t.noOriginalIdeas}
                    </p>
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
