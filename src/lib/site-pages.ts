export type PageMeta = {
  modified: string;
  published?: string;
};

export const PAGES = {
  "/welcome": { modified: "2026-05-30" },
  "/how-it-works": { modified: "2026-05-30" },
  "/about": { modified: "2026-05-30" },
  "/faq": { modified: "2026-05-30" },
  "/guides": { modified: "2026-05-30" },
  "/guides/convert-cups-to-grams": {
    published: "2026-05-30",
    modified: "2026-05-30",
  },
  "/guides/save-youtube-recipes": {
    published: "2026-05-30",
    modified: "2026-05-30",
  },
  "/guides/prep-first-cooking": {
    published: "2026-05-30",
    modified: "2026-05-30",
  },
  "/security": { modified: "2026-05-30" },
  "/privacy": { modified: "2026-05-30" },
  "/terms": { modified: "2026-05-30" },
  "/cookies": { modified: "2026-05-30" },
} as const satisfies Record<string, PageMeta>;

export type PagePath = keyof typeof PAGES;

export function getPageMeta(path: PagePath): PageMeta {
  return PAGES[path];
}
