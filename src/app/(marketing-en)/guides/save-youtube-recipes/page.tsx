import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  articleStructuredData,
  breadcrumbStructuredData,
  howToStructuredData,
} from "@/lib/structured-data";

const TITLE = "How to save a recipe from a YouTube cooking video";
const DESCRIPTION =
  "Why YouTube recipes are hard to follow at the stove, and how to turn any cooking video into a structured ingredient list and step-by-step instructions with Mintdish.";
const URL_PATH = "/guides/save-youtube-recipes";
const PUBLISHED = "2026-05-30";
const MODIFIED = "2026-05-30";

const HOWTO_STEPS = [
  {
    name: "Copy the YouTube video URL",
    text: "Open the cooking video on YouTube and copy the URL from the address bar. Both full youtube.com links and youtu.be short links work.",
  },
  {
    name: "Paste it into Mintdish",
    text: "Sign in to Mintdish, paste the URL into the input field on the home page, and submit. Mintdish detects that it is a video and uses the YouTube parser path.",
  },
  {
    name: "Mintdish reads the transcript",
    text: "The video's transcript is fetched and analysed alongside any visual cues — Mintdish builds an ingredient list with quantities and orders the steps prep-first.",
  },
  {
    name: "Review, save, and cook",
    text: "Adjust serving size, fix anything the parser misread via per-recipe chat, then save the recipe. Each step links back to the timestamp in the original video so you can verify.",
  },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: URL_PATH,
    languages: {
      en: URL_PATH,
      ro: `${URL_PATH}/ro`,
      "x-default": URL_PATH,
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function GuideYoutube() {
  return (
    <>
      <JsonLd
        data={articleStructuredData({
          locale: "en",
          url: URL_PATH,
          headline: TITLE,
          description: DESCRIPTION,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
        })}
      />
      <JsonLd
        data={howToStructuredData({
          locale: "en",
          url: URL_PATH,
          name: TITLE,
          description: DESCRIPTION,
          steps: HOWTO_STEPS,
        })}
      />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Home", url: "/welcome" },
          { name: "Guides", url: "/guides" },
          { name: TITLE, url: URL_PATH },
        ])}
      />
      <MarketingArticle
        locale="en"
        breadcrumbs={[
          { name: "Home", href: "/welcome" },
          { name: "Guides", href: "/guides" },
          { name: TITLE },
        ]}
      >
        <h1>{TITLE}</h1>
        <p className="text-lg">
          YouTube is full of great cooking content but it is a terrible cooking
          interface. You cannot scan a video for ingredients, you cannot scroll
          back to the right step with floury fingers, and the chef rarely tells
          you the actual quantities until they are already in the bowl. This
          guide shows the fastest way to turn a YouTube cooking video into a
          structured recipe you can cook from.
        </p>

        <h2>Why YouTube recipes are hard to follow</h2>
        <ul>
          <li>Quantities are spoken, not listed — easy to miss.</li>
          <li>Ingredients pop up mid-step instead of upfront.</li>
          <li>Prep and cook actions are interleaved.</li>
          <li>Pinned comments with full recipes are inconsistent and disappear.</li>
        </ul>

        <h2>The four-step shortcut</h2>
        <ol>
          {HOWTO_STEPS.map((step) => (
            <li key={step.name}>
              <strong>{step.name}.</strong> {step.text}
            </li>
          ))}
        </ol>

        <h2>What you end up with</h2>
        <p>
          A clean recipe with metric quantities, a single ingredient list, prep
          steps grouped before cooking steps, and per-step ingredient hints —
          all linked back to timestamps in the original video so you can spot
          check anything the transcript missed.
        </p>

        <p>
          Want to try it now? Head to <a href="/welcome">the home page</a> and
          paste a video URL, or read more about{" "}
          <a href="/how-it-works">how Mintdish works</a> end to end.
        </p>
      </MarketingArticle>
    </>
  );
}
