import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import { breadcrumbStructuredData } from "@/lib/structured-data";

const TITLE = "Ghiduri Mintdish";
const DESCRIPTION =
  "Ghiduri practice de gătit și organizare de rețete de la Mintdish: conversii metrice, salvarea rețetelor de pe YouTube și metoda prep-first.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/guides/ro",
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
    href: "/guides/convert-cups-to-grams/ro",
    title: "Cum convertești căni, uncii și „stick-uri” de unt în grame",
    description:
      "Un ghid ingredient-aware pentru conversia unităților din rețetele americane în sistem metric și cum o face Mintdish automat.",
  },
  {
    href: "/guides/save-youtube-recipes/ro",
    title: "Cum salvezi o rețetă dintr-un videoclip YouTube de gătit",
    description:
      "De ce sunt greu de urmărit rețetele de pe YouTube și cum transformă Mintdish un videoclip în ingrediente și pași structurați.",
  },
  {
    href: "/guides/prep-first-cooking/ro",
    title: "Metoda prep-first: gătești calm, termini mai repede",
    description:
      "De ce orice școală de bucătărie predă mise en place și cum poți reordona orice rețetă ca prepararea să se întâmple înainte de foc.",
  },
];

export default function GuidesIndexRo() {
  return (
    <>
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "/welcome/ro" },
          { name: TITLE, url: "/guides/ro" },
        ])}
      />
      <MarketingArticle
        locale="ro"
        breadcrumbs={[
          { name: "Acasă", href: "/welcome/ro" },
          { name: TITLE },
        ]}
      >
        <h1>Ghiduri</h1>
        <p className="text-lg">
          Ghiduri scurte și practice care completează parserul Mintdish — fișe
          de conversie, ghiduri video-către-rețetă și filosofia gătitului
          prep-first.
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
