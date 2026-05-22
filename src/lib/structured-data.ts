import type { Locale } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

export function landingStructuredData(locale: Locale): JsonLdGraph {
  const inLanguage = locale === "ro" ? "ro-RO" : "en-US";
  const welcomeUrl =
    locale === "ro" ? `${SITE_URL}/welcome/ro` : `${SITE_URL}/welcome`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "Mintdish",
        url: SITE_URL,
        logo: `${SITE_URL}/icons/icon-512.png`,
        email: "horia@mintdish.io",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: "Mintdish",
        inLanguage,
        publisher: { "@id": `${SITE_URL}#organization` },
      },
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
