import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { ManageCookiePreferencesButton } from "@/components/ManageCookiePreferencesButton";

export const metadata: Metadata = {
  title: "Politica de cookie-uri",
  alternates: {
    canonical: "/cookies/ro",
    languages: { en: "/cookies", ro: "/cookies/ro" },
  },
};

export default function CookiePolicyRo() {
  return (
    <LegalDocument>
      <h1>Politica de cookie-uri</h1>
      <p className="text-gray-500">Ultima actualizare: 20 mai 2026</p>

      <p>
        Mintdish folosește cookie-uri pentru a menține aplicația funcțională
        și, cu acordul tău, pentru a înțelege cum este utilizată.
      </p>

      <ManageCookiePreferencesButton label="Gestionează preferințele de cookie-uri" />

      <h2>Necesare</h2>
      <p>
        Cookie-uri necesare pentru funcționarea aplicației — te mențin
        autentificat și îți rețin preferința de limbă. Acestea sunt setate
        întotdeauna și nu pot fi dezactivate.
      </p>

      <h2>Analiză</h2>
      <p>
        Cookie-uri care ne ajută să înțelegem cum este folosit Mintdish, ca să-l
        putem îmbunătăți. Acestea sunt setate doar dacă accepți cookie-uri de
        analiză. Niciun fel de date personale nu sunt vândute sau partajate cu
        terți.
      </p>

      <h2>Contact</h2>
      <p>
        Întrebări? Scrie la{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </LegalDocument>
  );
}
