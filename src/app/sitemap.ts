import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function alternates(enPath: string, roPath: string) {
  return {
    languages: {
      en: `${BASE_URL}${enPath}`,
      ro: `${BASE_URL}${roPath}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ en: string; ro: string; priority: number }> = [
    { en: "/welcome", ro: "/welcome/ro", priority: 1.0 },
    { en: "/privacy", ro: "/privacy/ro", priority: 0.3 },
    { en: "/terms", ro: "/terms/ro", priority: 0.3 },
    { en: "/cookies", ro: "/cookies/ro", priority: 0.3 },
  ];

  return pages.flatMap(({ en, ro, priority }) => {
    const alts = alternates(en, ro);
    return [
      { url: `${BASE_URL}${en}`, priority, alternates: alts },
      { url: `${BASE_URL}${ro}`, priority, alternates: alts },
    ];
  });
}
