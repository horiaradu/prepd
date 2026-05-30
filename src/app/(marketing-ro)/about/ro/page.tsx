import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  breadcrumbStructuredData,
  personStructuredData,
} from "@/lib/structured-data";

const TITLE = "Despre Mintdish";
const DESCRIPTION =
  "Mintdish este construit de Horia Radu, un inginer software care s-a săturat de povești pe bloguri culinare. Iată cine este în spatele aplicației și cum poți lua legătura.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/about/ro",
    languages: {
      en: "/about",
      ro: "/about/ro",
      "x-default": "/about",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function AboutRo() {
  return (
    <>
      <JsonLd data={personStructuredData("ro")} />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "/welcome/ro" },
          { name: TITLE, url: "/about/ro" },
        ])}
      />
      <MarketingArticle
        locale="ro"
        breadcrumbs={[
          { name: "Acasă", href: "/welcome/ro" },
          { name: TITLE },
        ]}
      >
        <h1>Despre Mintdish</h1>
        <p className="text-lg">
          Mintdish este un organizator personal de rețete care ia linkuri
          dezordonate, videoclipuri YouTube și poze din cărți de bucate și le
          transformă în rețete curate, metrice, cu pașii în ordinea prep-first.
          Este construit și întreținut de o singură persoană.
        </p>

        <h2>Cine este în spate</h2>
        <p>
          Mintdish este construit de{" "}
          <a
            href="https://github.com/horiaradu"
            rel="noopener noreferrer"
            target="_blank"
          >
            Horia Radu
          </a>
          , inginer software din Londra. Scrie software profesionist din 2010
          în proiecte de gătit și unelte pentru dezvoltatori, și a pornit
          Mintdish dintr-o iritare personală: fiecare rețetă pe care voia să
          o gătească era îngropată într-un articol de 2.000 de cuvinte sau
          ascunsă într-un videoclip YouTube, în căni și uncii, cu pașii în
          ordine greșită.
        </p>

        <h2>Ce reprezintă Mintdish</h2>
        <ul>
          <li>
            <strong>Întâi oamenii.</strong> Mintdish este făcut pentru cei care
            gătesc, nu pentru algoritmi — conținutul este structurat ca să fie
            ușor de citit chiar la aragaz.
          </li>
          <li>
            <strong>Sincer despre AI.</strong> Procesarea și chat-ul folosesc
            Google Gemini. Imaginile generate sunt marcate cu filigran.
            Biblioteca ta este privată și nu este folosită pentru antrenarea
            niciunui model.
          </li>
          <li>
            <strong>Metric, prep-first, fără umplutură.</strong> Cantitățile
            sunt convertite în grame și mililitri ținând cont de ingredient,
            prepararea este separată de gătit, iar povestea rămâne la sursă.
          </li>
        </ul>

        <h2>Ia legătura</h2>
        <p>
          Ai feedback, un bug de procesare sau o idee de parteneriat? Scrie la{" "}
          <a href="mailto:horia@mintdish.io">horia@mintdish.io</a> sau deschide
          un issue pe{" "}
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
