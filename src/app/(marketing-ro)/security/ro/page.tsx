import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import { breadcrumbStructuredData } from "@/lib/structured-data";

const TITLE = "Securitate și gestionarea datelor";
const DESCRIPTION =
  "Cum stochează Mintdish rețetele, pozele și datele contului; cum funcționează procesarea AI și analiza; ce se partajează și ce nu cu terțe părți.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/security/ro",
    languages: {
      en: "/security",
      ro: "/security/ro",
      "x-default": "/security",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function SecurityRo() {
  return (
    <>
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "/welcome/ro" },
          { name: TITLE, url: "/security/ro" },
        ])}
      />
      <MarketingArticle
        locale="ro"
        breadcrumbs={[
          { name: "Acasă", href: "/welcome/ro" },
          { name: TITLE },
        ]}
      >
        <h1>Securitate și gestionarea datelor</h1>
        <p className="text-lg">
          Mintdish gestionează rețetele pe care le salvezi, pozele pe care le
          încarci și datele contului tău. Această pagină rezumă unde sunt
          stocate, cine le vede și cum funcționează procesarea AI și analiza.
          Versiunea legală completă este în{" "}
          <a href="/privacy/ro">Politica de confidențialitate</a>.
        </p>

        <h2>Unde sunt datele tale</h2>
        <ul>
          <li>
            <strong>Rețetele și datele contului</strong> sunt stocate într-o
            bază de date Postgres găzduită pe Neon (regiune UE) și accesată doar
            prin TLS.
          </li>
          <li>
            <strong>Pozele și imaginile generate</strong> sunt stocate în Vercel
            Blob cu acces privat și sunt servite doar prin proxy autentificat.
          </li>
          <li>
            <strong>Autentificarea</strong> este gestionată de NextAuth.js cu
            Google OAuth — Mintdish nu vede niciodată parola ta Google.
          </li>
        </ul>

        <h2>Cum funcționează procesarea AI</h2>
        <ul>
          <li>
            URL-urile de rețete, transcripturile și pozele sunt trimise către
            Google Gemini conform termenilor API Google, exclusiv pentru
            procesare și răspunsurile din chat.
          </li>
          <li>
            Mintdish nu antrenează modele proprii și nu partajează biblioteca
            ta cu terți în afară de ce este necesar pentru serviciu.
          </li>
          <li>
            Imaginile generate de Gemini 2.5 Flash Image au filigran
            „Generated with AI”, ca să nu fie confundate cu fotografii reale.
          </li>
        </ul>

        <h2>Analiză și raportare erori</h2>
        <ul>
          <li>
            Analiza (Google Analytics, Vercel Analytics, Speed Insights)
            rulează doar dacă accepți cookie-urile de analiză în bannerul de
            consimțământ.
          </li>
          <li>
            Sentry este folosit pentru raportarea erorilor; ID-urile și
            adresele de email ale utilizatorilor pot apărea în rapoarte pentru
            a facilita diagnosticarea.
          </li>
          <li>
            Poți actualiza sau revoca oricând consimțământul din pagina{" "}
            <a href="/cookies/ro">Preferințe cookie</a>.
          </li>
        </ul>

        <h2>Ștergerea contului</h2>
        <p>
          Pentru a-ți șterge contul și toate datele asociate — rețete, poze,
          istoric chat și emailul de waitlist — scrie la{" "}
          <a href="mailto:horia@mintdish.io">horia@mintdish.io</a> de pe adresa
          asociată contului și vom acționa în șapte zile.
        </p>

        <h2>Raportarea unei vulnerabilități</h2>
        <p>
          Dacă crezi că ai descoperit o problemă de securitate în Mintdish,
          scrie la <a href="mailto:horia@mintdish.io">horia@mintdish.io</a> cu
          detalii și pași de reproducere. Răspundem la rapoarte în două zile
          lucrătoare.
        </p>
      </MarketingArticle>
    </>
  );
}
