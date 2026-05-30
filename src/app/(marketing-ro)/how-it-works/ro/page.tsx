import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  breadcrumbStructuredData,
  howToStructuredData,
} from "@/lib/structured-data";

const TITLE = "Cum funcționează Mintdish";
const DESCRIPTION =
  "Cum procesează Mintdish rețete din linkuri, videoclipuri YouTube și poze: scraping, citirea transcriptului, OCR cu vision, conversie metrică și reordonare prep-first.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/how-it-works/ro",
    languages: {
      en: "/how-it-works",
      ro: "/how-it-works/ro",
      "x-default": "/how-it-works",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function HowItWorksRo() {
  const steps = [
    {
      name: "Lipești un link, un videoclip sau o poză",
      text: "Lipește un URL de rețetă, un videoclip YouTube de gătit sau încarcă o poză cu o pagină de carte ori o rețetă scrisă de mână. Mintdish detectează tipul sursei și o trimite către parserul potrivit.",
    },
    {
      name: "Mintdish citește sursa",
      text: "Pentru URL-uri, Mintdish ia pagina cu cheerio și extrage blocul rețetei (folosind schema Recipe când există, altfel conținut lizibil). Pentru YouTube citește transcriptul. Pentru poze folosește OCR cu Gemini vision.",
    },
    {
      name: "Cantitățile sunt convertite în sistem metric",
      text: "Căni, uncii, linguri, stick-uri de unt și pinte sunt convertite ingredient cu ingredient în grame și mililitri, ca să obții numere folosibile, nu doar înmulțite.",
    },
    {
      name: "Pașii sunt rearanjați prep-first",
      text: "Fiecare tocare, marinare sau pauză este grupată în pași de preparare care se întâmplă înainte de a porni focul. Apoi fiecare pas de gătit listează doar ingredientele folosite chiar atunci.",
    },
    {
      name: "Salvezi, scalezi, ajustezi",
      text: "Rețetele salvate pot fi rescalate la alt număr de porții, editate prin chat per rețetă sau partajate pe email. Rețetele fără poze pot primi o imagine generată la cerere, marcată ca AI.",
    },
  ];

  return (
    <>
      <JsonLd
        data={howToStructuredData({
          locale: "ro",
          url: "/how-it-works/ro",
          name: TITLE,
          description: DESCRIPTION,
          steps,
        })}
      />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "/welcome/ro" },
          { name: TITLE, url: "/how-it-works/ro" },
        ])}
      />
      <MarketingArticle
        locale="ro"
        breadcrumbs={[
          { name: "Acasă", href: "/welcome/ro" },
          { name: TITLE },
        ]}
      >
        <h1>{TITLE}</h1>
        <p className="text-lg">
          Mintdish transformă orice rețetă — un link, un videoclip YouTube sau o
          poză — într-o rețetă curată, metrică și prep-first, după care chiar poți
          găti. Iată ce se întâmplă între momentul în care lipești ceva și momentul
          în care apare o rețetă salvată în biblioteca ta.
        </p>

        {steps.map((step, index) => (
          <section key={step.name}>
            <h2>
              {index + 1}. {step.name}
            </h2>
            <p>{step.text}</p>
          </section>
        ))}

        <h2>Ce nu mai trebuie să faci tu</h2>
        <ul>
          <li>Să convertești manual cantitățile — Mintdish se ocupă de căni, uncii, stick-uri și pinte.</li>
          <li>Să recitești rețeta ca să vezi ce ingredient urmează — fiecare pas le listează singur.</li>
          <li>Să derulezi printre povești de pe blog — păstrăm doar ce ai nevoie ca să gătești.</li>
          <li>Să rescrii o rețetă dintr-o poză de carte — fă o poză, încarc-o și gata.</li>
        </ul>

        <p>
          Vezi <a href="/faq/ro">întrebările frecvente</a> pentru limitele
          parserului, site-uri suportate și detalii de confidențialitate, sau
          citește <a href="/guides/prep-first-cooking/ro">ghidul nostru despre
          gătitul prep-first</a> ca să înțelegi de ce contează reordonarea.
        </p>
      </MarketingArticle>
    </>
  );
}
