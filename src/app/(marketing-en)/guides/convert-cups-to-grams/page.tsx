import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  articleStructuredData,
  breadcrumbStructuredData,
} from "@/lib/structured-data";
import { PAGES } from "@/lib/site-pages";

const TITLE = "How to convert cups, ounces, and sticks of butter to grams";
const DESCRIPTION =
  "An ingredient-aware cheat sheet for converting US recipe units to metric — flour, sugar, butter, and liquids — plus how Mintdish does the conversion automatically.";
const URL_PATH = "/guides/convert-cups-to-grams";
const { published: PUBLISHED, modified: MODIFIED } = PAGES[URL_PATH];

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

export default function GuideCupsToGrams() {
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
          Cup measurements are convenient at the supermarket and a nightmare in
          the kitchen — a cup of flour and a cup of water do not weigh the same,
          and a &quot;stick&quot; of butter is not even an SI unit. This guide
          gives you the conversions that actually matter, plus a faster option
          if you would rather skip the cheat sheet.
        </p>

        <h2>The skip-the-math option</h2>
        <p>
          Paste any recipe URL into <a href="/welcome">Mintdish</a> and every
          quantity is converted to grams or millilitres ingredient-aware before
          the recipe lands in your library. You never have to do the maths
          again, and the per-step ingredient lists already use the converted
          values.
        </p>

        <h2>Why ingredient-aware matters</h2>
        <p>
          A volume-to-weight conversion depends on density. The same 1 cup
          measure weighs:
        </p>
        <ul>
          <li>All-purpose flour — about 120 g</li>
          <li>Granulated sugar — about 200 g</li>
          <li>Brown sugar (packed) — about 220 g</li>
          <li>Butter — about 227 g (this is also exactly 2 sticks)</li>
          <li>Honey — about 340 g</li>
          <li>Water — exactly 237 g (or 237 ml)</li>
        </ul>
        <p>
          A blanket &quot;1 cup = 240 g&quot; conversion would over-flour or
          under-sweeten almost every baking recipe. Mintdish picks the right
          density per ingredient automatically.
        </p>

        <h2>Quick conversions you can memorise</h2>
        <ul>
          <li>1 stick of butter = 113 g</li>
          <li>1 tablespoon = 15 ml liquid (or about 14 g butter)</li>
          <li>1 teaspoon = 5 ml</li>
          <li>1 fluid ounce = 30 ml</li>
          <li>1 ounce (weight) = 28 g</li>
          <li>1 pound = 454 g</li>
          <li>1 pint (US) = 473 ml</li>
          <li>1 quart (US) = 946 ml</li>
        </ul>

        <h2>Oven temperatures</h2>
        <ul>
          <li>325 °F = 165 °C</li>
          <li>350 °F = 175 °C</li>
          <li>375 °F = 190 °C</li>
          <li>400 °F = 205 °C</li>
          <li>425 °F = 220 °C</li>
          <li>450 °F = 230 °C</li>
        </ul>

        <p>
          For more on how Mintdish parses recipes, see{" "}
          <a href="/how-it-works">How Mintdish works</a>, or jump straight in
          via the <a href="/welcome">home page</a>.
        </p>
      </MarketingArticle>
    </>
  );
}
