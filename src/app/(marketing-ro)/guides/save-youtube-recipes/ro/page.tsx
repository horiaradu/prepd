import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  articleStructuredData,
  breadcrumbStructuredData,
  howToStructuredData,
} from "@/lib/structured-data";

const TITLE = "Cum salvezi o rețetă dintr-un videoclip YouTube de gătit";
const DESCRIPTION =
  "De ce sunt greu de urmărit rețetele de pe YouTube și cum transformi orice videoclip de gătit într-o listă de ingrediente și pași structurați cu Mintdish.";
const URL_PATH = "/guides/save-youtube-recipes/ro";
const PUBLISHED = "2026-05-30";
const MODIFIED = "2026-05-30";

const HOWTO_STEPS = [
  {
    name: "Copiază URL-ul videoclipului YouTube",
    text: "Deschide videoclipul de gătit pe YouTube și copiază URL-ul din bara de adrese. Funcționează atât linkurile complete youtube.com, cât și cele scurte youtu.be.",
  },
  {
    name: "Lipește-l în Mintdish",
    text: "Autentifică-te în Mintdish, lipește URL-ul în câmpul de pe pagina principală și trimite. Mintdish detectează că este un videoclip și folosește parserul YouTube.",
  },
  {
    name: "Mintdish citește transcriptul",
    text: "Transcriptul videoclipului este preluat și analizat împreună cu indicii vizuali — Mintdish construiește o listă de ingrediente cu cantități și ordonează pașii prep-first.",
  },
  {
    name: "Verifici, salvezi, gătești",
    text: "Ajustează numărul de porții, corectează prin chat ce a greșit parserul, apoi salvează rețeta. Fiecare pas are link la momentul potrivit din videoclipul original ca să poți verifica.",
  },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: URL_PATH,
    languages: {
      en: "/guides/save-youtube-recipes",
      ro: URL_PATH,
      "x-default": "/guides/save-youtube-recipes",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function GuideYoutubeRo() {
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
        data={howToStructuredData({
          locale: "ro",
          url: URL_PATH,
          name: TITLE,
          description: DESCRIPTION,
          steps: HOWTO_STEPS,
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
          YouTube este plin de conținut de gătit excelent, dar este o interfață
          de gătit groaznică. Nu poți scana un videoclip ca să vezi
          ingredientele, nu poți derula înapoi cu degetele pline de făină, iar
          bucătarul rareori spune cantitățile reale înainte să fie deja în bol.
          Acest ghid arată cea mai rapidă metodă de a transforma un videoclip
          de gătit într-o rețetă structurată după care chiar poți găti.
        </p>

        <h2>De ce sunt greu de urmărit rețetele de pe YouTube</h2>
        <ul>
          <li>Cantitățile sunt spuse, nu listate — ușor de ratat.</li>
          <li>Ingredientele apar la mijlocul pasului, nu la început.</li>
          <li>Prepararea și gătitul sunt amestecate.</li>
          <li>Comentariile fixate cu rețeta completă sunt inconsistente și dispar.</li>
        </ul>

        <h2>Scurtătura în patru pași</h2>
        <ol>
          {HOWTO_STEPS.map((step) => (
            <li key={step.name}>
              <strong>{step.name}.</strong> {step.text}
            </li>
          ))}
        </ol>

        <h2>Ce obții la final</h2>
        <p>
          O rețetă curată, cu cantități metrice, o singură listă de ingrediente,
          pași de preparare grupați înaintea pașilor de gătit și sugestii de
          ingrediente pe fiecare pas — toate cu link la momentul potrivit din
          videoclip ca să verifici orice a ratat transcriptul.
        </p>

        <p>
          Vrei să încerci acum? Mergi la <a href="/welcome/ro">pagina
          principală</a> și lipește un URL de videoclip, sau citește mai mult
          despre <a href="/how-it-works/ro">cum funcționează Mintdish</a> cap
          la cap.
        </p>
      </MarketingArticle>
    </>
  );
}
