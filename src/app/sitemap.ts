import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const welcomeAlternates = {
    languages: {
      en: `${BASE_URL}/welcome`,
      ro: `${BASE_URL}/welcome/ro`,
    },
  };

  return [
    {
      url: `${BASE_URL}/welcome`,
      priority: 1.0,
      alternates: welcomeAlternates,
    },
    {
      url: `${BASE_URL}/welcome/ro`,
      priority: 1.0,
      alternates: welcomeAlternates,
    },
    { url: `${BASE_URL}/privacy`, priority: 0.3 },
    { url: `${BASE_URL}/terms`, priority: 0.3 },
    { url: `${BASE_URL}/cookies`, priority: 0.3 },
  ];
}
