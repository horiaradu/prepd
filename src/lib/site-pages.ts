export type PageMeta = {
  // ISO 8601 datetime with timezone — Google's structured data parser
  // rejects bare date strings.
  modified: string;
  published?: string;
};

export const PAGES = {
  "/welcome": { modified: "2026-05-30T00:00:00Z" },
  "/how-it-works": { modified: "2026-05-30T00:00:00Z" },
  "/about": { modified: "2026-05-30T00:00:00Z" },
  "/faq": { modified: "2026-05-30T00:00:00Z" },
  "/guides": { modified: "2026-05-30T00:00:00Z" },
  "/guides/convert-cups-to-grams": {
    published: "2026-05-30T00:00:00Z",
    modified: "2026-05-30T00:00:00Z",
  },
  "/guides/save-youtube-recipes": {
    published: "2026-05-30T00:00:00Z",
    modified: "2026-05-30T00:00:00Z",
  },
  "/guides/prep-first-cooking": {
    published: "2026-05-30T00:00:00Z",
    modified: "2026-05-30T00:00:00Z",
  },
  "/security": { modified: "2026-05-30T00:00:00Z" },
  "/privacy": { modified: "2026-05-30T00:00:00Z" },
  "/terms": { modified: "2026-05-30T00:00:00Z" },
  "/cookies": { modified: "2026-05-30T00:00:00Z" },
} as const satisfies Record<string, PageMeta>;

export type PagePath = keyof typeof PAGES;

export function getPageMeta(path: PagePath): PageMeta {
  return PAGES[path];
}

// Marketing pages that anyone can read — proxy skips the session check.
// /welcome is excluded because the proxy redirects signed-in visitors away
// from it.
export const PUBLIC_MARKETING_PATHS: ReadonlySet<string> = new Set(
  (Object.keys(PAGES) as PagePath[])
    .filter((p) => p !== "/welcome")
    .flatMap((p) => [p, `${p}/ro`]),
);
