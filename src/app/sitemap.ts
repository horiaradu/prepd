import type { MetadataRoute } from "next";
import { PAGES, type PagePath } from "@/lib/site-pages";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function alternates(enPath: string, roPath: string) {
  return {
    languages: {
      en: `${BASE_URL}${enPath}`,
      ro: `${BASE_URL}${roPath}`,
      "x-default": `${BASE_URL}${enPath}`,
    },
  };
}

type SitemapEntry = {
  path: PagePath;
  priority: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const ENTRIES: SitemapEntry[] = [
  { path: "/welcome", priority: 1.0, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/guides", priority: 0.7, changeFrequency: "monthly" },
  {
    path: "/guides/convert-cups-to-grams",
    priority: 0.8,
    changeFrequency: "yearly",
  },
  {
    path: "/guides/save-youtube-recipes",
    priority: 0.8,
    changeFrequency: "yearly",
  },
  {
    path: "/guides/prep-first-cooking",
    priority: 0.8,
    changeFrequency: "yearly",
  },
  { path: "/security", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ENTRIES.flatMap(({ path, priority, changeFrequency }) => {
    const enPath = path;
    const roPath = `${path}/ro`;
    const alts = alternates(enPath, roPath);
    const lastModified = new Date(PAGES[path].modified);
    return [
      {
        url: `${BASE_URL}${enPath}`,
        priority,
        changeFrequency,
        lastModified,
        alternates: alts,
      },
      {
        url: `${BASE_URL}${roPath}`,
        priority,
        changeFrequency,
        lastModified,
        alternates: alts,
      },
    ];
  });
}
