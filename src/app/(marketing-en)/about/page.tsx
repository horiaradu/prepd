import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  breadcrumbStructuredData,
  personStructuredData,
} from "@/lib/structured-data";

const TITLE = "About Mintdish";
const DESCRIPTION =
  "Mintdish is built by Horia Radu, a software engineer who got tired of food-blog backstories. Here is who is behind the app and how to get in touch.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/about",
    languages: {
      en: "/about",
      ro: "/about/ro",
      "x-default": "/about",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function About() {
  return (
    <>
      <JsonLd data={personStructuredData("en")} />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Home", url: "/welcome" },
          { name: TITLE, url: "/about" },
        ])}
      />
      <MarketingArticle
        locale="en"
        breadcrumbs={[{ name: "Home", href: "/welcome" }, { name: TITLE }]}
      >
        <h1>About Mintdish</h1>
        <p className="text-lg">
          Mintdish is a personal recipe organizer that takes messy recipe links,
          YouTube videos, and cookbook photos and turns them into clean,
          metric-system recipes with prep-first ordering. It is built and
          maintained by one person.
        </p>

        <h2>Who is behind it</h2>
        <p>
          Mintdish is built by{" "}
          <a
            href="https://github.com/horiaradu"
            rel="noopener noreferrer"
            target="_blank"
          >
            Horia Radu
          </a>
          , a software engineer based in London. He has been writing software
          professionally since 2010 across cooking-adjacent and developer-tooling
          projects, and started Mintdish to scratch a personal itch: every recipe
          he wanted to cook was buried in a 2,000-word blog post or trapped in a
          YouTube video, in cups and ounces, with steps in the wrong order.
        </p>

        <h2>What Mintdish stands for</h2>
        <ul>
          <li>
            <strong>People first.</strong> Mintdish is built for cooks, not for
            algorithms — content is structured for readability while you are
            actually at the stove.
          </li>
          <li>
            <strong>Honest about AI.</strong> Parsing and chat use Google Gemini.
            Generated images are watermarked. Your library is private and is not
            used to train any models.
          </li>
          <li>
            <strong>Metric, prep-first, no fluff.</strong> Quantities are
            converted to grams and millilitres ingredient-aware, prep is
            separated from cooking, and the backstory stays at the source.
          </li>
        </ul>

        <h2>Get in touch</h2>
        <p>
          Have feedback, a parsing bug, or a partnership idea? Email{" "}
          <a href="mailto:horia@mintdish.io">horia@mintdish.io</a> or open an
          issue on{" "}
          <a
            href="https://github.com/horiaradu/prepd"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          .
        </p>
      </MarketingArticle>
    </>
  );
}
