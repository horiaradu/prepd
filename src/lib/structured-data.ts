import type { Locale } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

const FOUNDER_ID = `${SITE_URL}#founder`;

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: "Mintdish",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    email: "horia@mintdish.io",
    founder: { "@id": FOUNDER_ID },
  };
}

function founderNode(locale: Locale) {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: "Horia Radu",
    url: locale === "ro" ? `${SITE_URL}/about/ro` : `${SITE_URL}/about`,
    jobTitle: locale === "ro" ? "Fondator" : "Founder",
    worksFor: { "@id": `${SITE_URL}#organization` },
    sameAs: [
      "https://github.com/horiaradu",
      "https://www.linkedin.com/in/horiaradu/",
    ],
  };
}

function websiteNode(locale: Locale) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: "Mintdish",
    inLanguage: locale === "ro" ? "ro-RO" : "en-US",
    publisher: { "@id": `${SITE_URL}#organization` },
  };
}

export function landingStructuredData(locale: Locale): JsonLdGraph {
  const inLanguage = locale === "ro" ? "ro-RO" : "en-US";
  const welcomeUrl =
    locale === "ro" ? `${SITE_URL}/welcome/ro` : `${SITE_URL}/welcome`;

  const featureList =
    locale === "ro"
      ? [
          "Procesează rețete din linkuri de site-uri culinare",
          "Procesează rețete din videoclipuri YouTube cu transcript",
          "Procesează rețete din poze și capturi de ecran",
          "Conversie automată în sistem metric (grame, mililitri)",
          "Pași de preparare separați de pașii de gătit",
          "Ingrediente afișate per pas",
          "Sugestii de rețete prin căutare în limbaj natural",
          "Generare imagine pentru rețete cu Gemini",
          "Chat per rețetă pentru ajustări și scalare",
        ]
      : [
          "Parse recipes from food blog and recipe site URLs",
          "Parse recipes from YouTube cooking videos via transcript",
          "Parse recipes from photos and screenshots",
          "Automatic conversion to metric (grams, millilitres)",
          "Prep steps separated from cook steps",
          "Per-step ingredient lists",
          "Recipe suggestions from natural-language prompts",
          "AI-generated hero images via Gemini",
          "Per-recipe chat to tweak, swap, and scale steps",
        ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      founderNode(locale),
      websiteNode(locale),
      {
        "@type": "WebPage",
        "@id": `${welcomeUrl}#webpage`,
        url: welcomeUrl,
        name:
          locale === "ro"
            ? "Mintdish — Sari peste blogul culinar. Direct rețeta."
            : "Mintdish — Skip the food blog. Just the recipe.",
        inLanguage,
        isPartOf: { "@id": `${SITE_URL}#website` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}#app`,
        name: "Mintdish",
        url: SITE_URL,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: ["en-US", "ro-RO"],
        screenshot: [
          `${SITE_URL}/landing/home-list.png`,
          `${SITE_URL}/landing/recipe-cooking.png`,
        ],
        featureList,
        description:
          locale === "ro"
            ? "Lipește un link de rețetă, un clip YouTube sau o poză — Mintdish extrage ingredientele, pașii și timpii. Fără introducerea kilometrică."
            : "Paste a recipe link, YouTube video, or photo — Mintdish pulls out ingredients, steps, and timing. No food blog fluff.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: { "@id": `${SITE_URL}#organization` },
      },
    ],
  };
}

export function faqStructuredData(
  questions: { question: string; answer: string }[],
): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: questions.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      },
    ],
  };
}

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbStructuredData(
  items: BreadcrumbItem[],
): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
        })),
      },
    ],
  };
}

export function personStructuredData(locale: Locale): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), founderNode(locale)],
  };
}

export type ArticleInput = {
  locale: Locale;
  url: string; // path, e.g. /guides/foo
  headline: string;
  description: string;
  datePublished: string; // ISO date
  dateModified: string; // ISO date
  image?: string; // path or absolute URL
};

export function articleStructuredData(input: ArticleInput): JsonLdGraph {
  const { locale, url, headline, description, datePublished, dateModified } =
    input;
  const absoluteUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  const inLanguage = locale === "ro" ? "ro-RO" : "en-US";
  const image = input.image
    ? input.image.startsWith("http")
      ? input.image
      : `${SITE_URL}${input.image}`
    : `${SITE_URL}/opengraph-image.png`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      founderNode(locale),
      {
        "@type": "Article",
        "@id": `${absoluteUrl}#article`,
        mainEntityOfPage: absoluteUrl,
        url: absoluteUrl,
        headline,
        description,
        inLanguage,
        datePublished,
        dateModified,
        image,
        author: { "@id": FOUNDER_ID },
        publisher: { "@id": `${SITE_URL}#organization` },
      },
    ],
  };
}

export type HowToStep = { name: string; text: string };

export type HowToInput = {
  locale: Locale;
  url: string;
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. PT2M
};

export function howToStructuredData(input: HowToInput): JsonLdGraph {
  const { locale, url, name, description, steps, totalTime } = input;
  const absoluteUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  const inLanguage = locale === "ro" ? "ro-RO" : "en-US";

  const howTo: Record<string, unknown> = {
    "@type": "HowTo",
    "@id": `${absoluteUrl}#howto`,
    name,
    description,
    inLanguage,
    step: steps.map((s, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: s.name,
      text: s.text,
    })),
  };
  if (totalTime) howTo.totalTime = totalTime;

  return {
    "@context": "https://schema.org",
    "@graph": [howTo],
  };
}
