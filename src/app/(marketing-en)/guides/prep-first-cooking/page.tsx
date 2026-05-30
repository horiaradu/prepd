import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  articleStructuredData,
  breadcrumbStructuredData,
} from "@/lib/structured-data";

const TITLE = "The prep-first method: cook calmly, finish faster";
const DESCRIPTION =
  "Why every cooking school teaches mise en place, and how to reorder any recipe so all the chopping, measuring, and resting happens before the heat is on.";
const URL_PATH = "/guides/prep-first-cooking";
const PUBLISHED = "2026-05-30";
const MODIFIED = "2026-05-30";

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

export default function GuidePrepFirst() {
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
          Cooking gets stressful when you are simultaneously chopping garlic,
          watching a pan, measuring soy sauce, and trying to remember what comes
          next. The fix is the oldest trick in any professional kitchen — finish
          all the prep before any of the cooking. This guide explains why it
          works and how to apply it to any recipe.
        </p>

        <h2>What &quot;prep-first&quot; means</h2>
        <p>
          Prep-first — chefs call it <em>mise en place</em> — means doing every
          non-heat task before you turn on the stove. Wash, chop, measure,
          marinate, rest, and pre-heat all happen first. Cooking is then a
          short, focused sequence of grabbing pre-measured bowls and pouring
          them into the pan at the right moment.
        </p>

        <h2>Why it makes you faster, not slower</h2>
        <ul>
          <li>
            <strong>No context switching.</strong> Chopping while a pan heats
            up sounds efficient until the garlic burns. Doing one task at a
            time finishes everything sooner.
          </li>
          <li>
            <strong>Fewer mistakes.</strong> Pre-measured ingredients in clearly
            labelled bowls eliminates the &quot;was that a tablespoon or a
            teaspoon?&quot; pause.
          </li>
          <li>
            <strong>Better timing.</strong> When the cooking is a tight
            sequence, sauces reduce, vegetables stay crisp, and meat does not
            overcook waiting for the next ingredient.
          </li>
        </ul>

        <h2>How to reorder any recipe yourself</h2>
        <ol>
          <li>Read the recipe end to end before you start.</li>
          <li>List every ingredient by its prep state — &quot;onion, diced&quot;, not &quot;1 onion&quot;.</li>
          <li>Group all chopping, peeling, mincing, marinating, and resting steps at the top.</li>
          <li>Pre-measure every spice and liquid into small bowls.</li>
          <li>Now read the cooking part — it should fit on one screen.</li>
        </ol>

        <h2>The shortcut</h2>
        <p>
          <a href="/welcome">Mintdish</a> reorders any parsed recipe prep-first
          automatically. Prep tasks are grouped at the top, cooking steps come
          after, and each cooking step lists exactly which ingredients to grab
          — no scrolling back to the top while something simmers.
        </p>

        <p>
          For more on the parser itself, see{" "}
          <a href="/how-it-works">How Mintdish works</a>.
        </p>
      </MarketingArticle>
    </>
  );
}
