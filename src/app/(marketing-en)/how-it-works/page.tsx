import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  breadcrumbStructuredData,
  howToStructuredData,
} from "@/lib/structured-data";

const TITLE = "How Mintdish works";
const DESCRIPTION =
  "How Mintdish parses recipes from links, YouTube videos, and photos: scraping, transcript reading, vision OCR, metric conversion, and prep-first reordering.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/how-it-works",
    languages: {
      en: "/how-it-works",
      ro: "/how-it-works/ro",
      "x-default": "/how-it-works",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function HowItWorks() {
  const steps = [
    {
      name: "Paste a link, video, or photo",
      text: "Paste a recipe URL, a YouTube cooking video, or upload a photo of a cookbook page or handwritten card. Mintdish detects which kind of source it is and routes it to the right parser.",
    },
    {
      name: "Mintdish reads the source",
      text: "For URLs, Mintdish fetches the page with cheerio and pulls out the recipe block (Recipe schema when available, fallback to readable content). For YouTube it reads the transcript. For photos it uses Gemini vision OCR.",
    },
    {
      name: "Quantities are converted to metric",
      text: "Cups, ounces, tablespoons, sticks of butter, and pints are converted ingredient-by-ingredient to grams and millilitres so the numbers are usable, not just multiplied.",
    },
    {
      name: "Steps are reordered prep-first",
      text: "Every chop, dice, marinade, and rest is grouped into prep steps that happen before the heat is on. Each cooking step then lists only the ingredients used at that moment.",
    },
    {
      name: "Save, scale, and refine",
      text: "Saved recipes can be rescaled to a different number of servings, edited via per-recipe chat, or shared by email. Recipes without photos can have a hero image generated on demand and watermarked as AI.",
    },
  ];

  return (
    <>
      <JsonLd
        data={howToStructuredData({
          locale: "en",
          url: "/how-it-works",
          name: TITLE,
          description: DESCRIPTION,
          steps,
        })}
      />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Home", url: "/welcome" },
          { name: TITLE, url: "/how-it-works" },
        ])}
      />
      <MarketingArticle
        locale="en"
        breadcrumbs={[
          { name: "Home", href: "/welcome" },
          { name: TITLE },
        ]}
      >
        <h1>{TITLE}</h1>
        <p className="text-lg">
          Mintdish turns any recipe — a link, a YouTube video, or a photo — into a
          clean, metric, prep-first recipe you can actually cook from. Here is what
          happens between the moment you paste something in and the moment a saved
          recipe appears in your library.
        </p>

        {steps.map((step, index) => (
          <section key={step.name}>
            <h2>
              {index + 1}. {step.name}
            </h2>
            <p>{step.text}</p>
          </section>
        ))}

        <h2>What you do not have to do</h2>
        <ul>
          <li>Hand-convert quantities — Mintdish handles cups, ounces, sticks, and pints.</li>
          <li>Re-read the recipe to find which ingredients go in next — every step lists its own.</li>
          <li>Scroll past blog backstory — only the parts you need to cook are kept.</li>
          <li>Re-type a recipe from a cookbook photo — snap, upload, and you are done.</li>
        </ul>

        <p>
          See the{" "}
          <a href="/faq">frequently asked questions</a> for parsing limits, supported
          sites, and privacy details, or read our{" "}
          <a href="/guides/prep-first-cooking">guide to prep-first cooking</a> for
          why the reordering matters.
        </p>
      </MarketingArticle>
    </>
  );
}
