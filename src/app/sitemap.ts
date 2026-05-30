import type { MetadataRoute } from "next";

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

const LAST_MODIFIED = "2026-05-30";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{
    en: string;
    ro: string;
    priority: number;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { en: "/welcome", ro: "/welcome/ro", priority: 1.0, changeFrequency: "weekly" },
    { en: "/how-it-works", ro: "/how-it-works/ro", priority: 0.9, changeFrequency: "monthly" },
    { en: "/about", ro: "/about/ro", priority: 0.6, changeFrequency: "yearly" },
    { en: "/faq", ro: "/faq/ro", priority: 0.7, changeFrequency: "monthly" },
    { en: "/guides", ro: "/guides/ro", priority: 0.7, changeFrequency: "monthly" },
    {
      en: "/guides/convert-cups-to-grams",
      ro: "/guides/convert-cups-to-grams/ro",
      priority: 0.8,
      changeFrequency: "yearly",
    },
    {
      en: "/guides/save-youtube-recipes",
      ro: "/guides/save-youtube-recipes/ro",
      priority: 0.8,
      changeFrequency: "yearly",
    },
    {
      en: "/guides/prep-first-cooking",
      ro: "/guides/prep-first-cooking/ro",
      priority: 0.8,
      changeFrequency: "yearly",
    },
    { en: "/security", ro: "/security/ro", priority: 0.5, changeFrequency: "yearly" },
    { en: "/privacy", ro: "/privacy/ro", priority: 0.3, changeFrequency: "yearly" },
    { en: "/terms", ro: "/terms/ro", priority: 0.3, changeFrequency: "yearly" },
    { en: "/cookies", ro: "/cookies/ro", priority: 0.3, changeFrequency: "yearly" },
  ];

  const lastModified = new Date(LAST_MODIFIED);

  return pages.flatMap(({ en, ro, priority, changeFrequency }) => {
    const alts = alternates(en, ro);
    return [
      {
        url: `${BASE_URL}${en}`,
        priority,
        changeFrequency,
        lastModified,
        alternates: alts,
      },
      {
        url: `${BASE_URL}${ro}`,
        priority,
        changeFrequency,
        lastModified,
        alternates: alts,
      },
    ];
  });
}
