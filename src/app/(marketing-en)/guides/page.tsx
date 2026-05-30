import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import { breadcrumbStructuredData } from "@/lib/structured-data";

const TITLE = "Mintdish guides";
const DESCRIPTION =
  "Practical cooking and recipe-organising guides from Mintdish: metric conversions, saving YouTube recipes, and the prep-first method.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/guides",
    languages: {
      en: "/guides",
      ro: "/guides/ro",
      "x-default": "/guides",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

const GUIDES = [
  {
    href: "/guides/convert-cups-to-grams",
    title: "How to convert cups, ounces, and sticks of butter to grams",
    description:
      "An ingredient-aware cheat sheet for converting US recipe units to metric, and how Mintdish does it automatically.",
  },
  {
    href: "/guides/save-youtube-recipes",
    title: "How to save a recipe from a YouTube cooking video",
    description:
      "Why YouTube recipes are hard to follow at the stove, and how Mintdish turns a video into structured ingredients and steps.",
  },
  {
    href: "/guides/prep-first-cooking",
    title: "The prep-first method: cook calmly, finish faster",
    description:
      "Why every cooking school teaches mise en place, and how to reorder any recipe so prep happens before the heat is on.",
  },
];

export default function GuidesIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Home", url: "/welcome" },
          { name: TITLE, url: "/guides" },
        ])}
      />
      <MarketingArticle
        locale="en"
        breadcrumbs={[{ name: "Home", href: "/welcome" }, { name: TITLE }]}
      >
        <h1>Guides</h1>
        <p className="text-lg">
          Short, practical guides that complement the Mintdish recipe parser —
          conversion cheat sheets, video-to-recipe walkthroughs, and the
          philosophy behind prep-first cooking.
        </p>

        <ul className="not-prose space-y-4 list-none pl-0">
          {GUIDES.map((g) => (
            <li
              key={g.href}
              className="rounded-lg border border-gray-200 p-4 hover:border-green-600 transition-colors"
            >
              <Link
                href={g.href}
                className="text-lg font-semibold text-gray-900 no-underline hover:text-green-700"
              >
                {g.title}
              </Link>
              <p className="mt-1 text-sm text-gray-600">{g.description}</p>
            </li>
          ))}
        </ul>
      </MarketingArticle>
    </>
  );
}
