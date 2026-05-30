import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  articleStructuredData,
  breadcrumbStructuredData,
} from "@/lib/structured-data";

const TITLE = "Cum convertești căni, uncii și „stick-uri” de unt în grame";
const DESCRIPTION =
  "Un ghid ingredient-aware pentru conversia unităților din rețete americane în sistem metric — făină, zahăr, unt și lichide — și cum face Mintdish conversia automat.";
const URL_PATH = "/guides/convert-cups-to-grams/ro";
const PUBLISHED = "2026-05-30";
const MODIFIED = "2026-05-30";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: URL_PATH,
    languages: {
      en: "/guides/convert-cups-to-grams",
      ro: URL_PATH,
      "x-default": "/guides/convert-cups-to-grams",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function GuideCupsToGramsRo() {
  return (
    <>
      <JsonLd
        data={articleStructuredData({
          locale: "ro",
          url: URL_PATH,
          headline: TITLE,
          description: DESCRIPTION,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
        })}
      />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "/welcome/ro" },
          { name: "Ghiduri", url: "/guides/ro" },
          { name: TITLE, url: URL_PATH },
        ])}
      />
      <MarketingArticle
        locale="ro"
        breadcrumbs={[
          { name: "Acasă", href: "/welcome/ro" },
          { name: "Ghiduri", href: "/guides/ro" },
          { name: TITLE },
        ]}
      >
        <h1>{TITLE}</h1>
        <p className="text-lg">
          Măsurătorile în căni sunt comode la magazin și un coșmar în
          bucătărie — o cană de făină și o cană de apă nu cântăresc la fel, iar
          un „stick” de unt nu este nici măcar o unitate SI. Acest ghid îți dă
          conversiile care contează, plus o variantă mai rapidă dacă vrei să
          sari peste tabel.
        </p>

        <h2>Varianta fără calcule</h2>
        <p>
          Lipește orice URL de rețetă în <a href="/welcome/ro">Mintdish</a> și
          fiecare cantitate este convertită în grame sau mililitri
          ingredient-aware înainte ca rețeta să ajungă în biblioteca ta. Nu mai
          trebuie să faci socotelile, iar lista per pas folosește deja valorile
          convertite.
        </p>

        <h2>De ce contează „ingredient-aware”</h2>
        <p>
          Conversia volum-greutate depinde de densitate. Aceeași cană cântărește:
        </p>
        <ul>
          <li>Făină albă — aproximativ 120 g</li>
          <li>Zahăr granulat — aproximativ 200 g</li>
          <li>Zahăr brun (presat) — aproximativ 220 g</li>
          <li>Unt — aproximativ 227 g (adică exact 2 stick-uri)</li>
          <li>Miere — aproximativ 340 g</li>
          <li>Apă — exact 237 g (sau 237 ml)</li>
        </ul>
        <p>
          O conversie generică de tipul „1 cană = 240 g” ar pune prea multă
          făină sau prea puțin zahăr în aproape orice rețetă de patiserie.
          Mintdish alege densitatea potrivită pe fiecare ingredient automat.
        </p>

        <h2>Conversii rapide de memorat</h2>
        <ul>
          <li>1 stick de unt = 113 g</li>
          <li>1 lingură = 15 ml lichid (sau aproximativ 14 g unt)</li>
          <li>1 linguriță = 5 ml</li>
          <li>1 uncie (lichid) = 30 ml</li>
          <li>1 uncie (greutate) = 28 g</li>
          <li>1 livră = 454 g</li>
          <li>1 pintă (US) = 473 ml</li>
          <li>1 quart (US) = 946 ml</li>
        </ul>

        <h2>Temperaturi cuptor</h2>
        <ul>
          <li>325 °F = 165 °C</li>
          <li>350 °F = 175 °C</li>
          <li>375 °F = 190 °C</li>
          <li>400 °F = 205 °C</li>
          <li>425 °F = 220 °C</li>
          <li>450 °F = 230 °C</li>
        </ul>

        <p>
          Pentru detalii despre cum procesează Mintdish rețetele, vezi{" "}
          <a href="/how-it-works/ro">Cum funcționează Mintdish</a>, sau intră
          direct prin <a href="/welcome/ro">pagina principală</a>.
        </p>
      </MarketingArticle>
    </>
  );
}
