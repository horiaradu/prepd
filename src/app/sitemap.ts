import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/welcome`, priority: 1.0 },
    { url: `${BASE_URL}/privacy`, priority: 0.3 },
    { url: `${BASE_URL}/terms`, priority: 0.3 },
    { url: `${BASE_URL}/cookies`, priority: 0.3 },
  ];
}
