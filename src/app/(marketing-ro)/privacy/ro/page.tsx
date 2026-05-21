import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Politică de confidențialitate",
  alternates: {
    canonical: "/privacy/ro",
    languages: { en: "/privacy", ro: "/privacy/ro" },
  },
};

export default function PrivacyPolicyRo() {
  return (
    <LegalDocument>
      <h1>Politică de confidențialitate</h1>
      <p className="text-gray-500">Ultima actualizare: 20 mai 2026</p>

      <h2>Ce colectăm</h2>
      <p>
        Când te autentifici cu Google, stocăm numele, adresa de email și poza
        de profil. Folosim aceste informații strict pentru a-ți identifica
        contul și pentru a-ți personaliza experiența.
      </p>

      <h2>Datele rețetelor</h2>
      <p>
        Rețetele pe care le salvezi, jurnalele de gătit, mesajele de chat și
        imaginile sunt stocate în baza noastră de date și asociate contului tău.
        Rețetele distribuite includ o copie a conținutului rețetei trimisă pe
        adresa de email a destinatarului.
      </p>

      <h2>Notificări push</h2>
      <p>
        Dacă activezi notificările push, stocăm endpointul de abonament push al
        browserului tău. Poți dezactiva notificările oricând din setările
        browserului.
      </p>

      <h2>Servicii terțe</h2>
      <ul>
        <li>
          <strong>Google OAuth</strong> — doar pentru autentificare; nu accesăm
          date Google dincolo de informațiile de bază din profil.
        </li>
        <li>
          <strong>Google Gemini</strong> — analiză și generare de rețete.
          Conținutul rețetelor (URL-uri, text, imagini) poate fi trimis către
          API-ul Gemini al Google pentru procesare.
        </li>
        <li>
          <strong>Google Tag Manager / Google Analytics</strong> — urmărirea
          evenimentelor și analiza utilizării, doar dacă ai acceptat cookie-uri
          de analiză.
        </li>
        <li>
          <strong>Vercel Analytics &amp; Speed Insights</strong> — analiză web
          anonimă și monitorizarea performanței, doar dacă ai acceptat
          cookie-uri de analiză.
        </li>
        <li>
          <strong>Sentry</strong> — urmărirea erorilor și monitorizarea
          performanței. ID-ul tău de utilizator și adresa de email pot fi
          incluse în rapoartele de eroare pentru a ajuta la diagnosticare.
        </li>
        <li>
          <strong>MailerLite</strong> — dacă te înscrii pe lista de așteptare,
          adresa ta de email este stocată în MailerLite și folosită pentru a te
          contacta despre Mintdish.
        </li>
        <li>
          <strong>Vercel</strong> — găzduire și stocare de imagini.
        </li>
        <li>
          <strong>Neon</strong> — găzduire bază de date.
        </li>
      </ul>

      <h2>Păstrarea datelor</h2>
      <p>
        Datele tale sunt păstrate atâta timp cât contul tău există. Pentru a-ți
        șterge contul și toate datele asociate, contactează-ne la{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>

      <h2>Cookie-uri</h2>
      <p>
        Folosim două categorii de cookie-uri. Vezi{" "}
        <a href="/cookies/ro">Politica de cookie-uri</a> pentru lista completă.
      </p>
      <ul>
        <li>
          <strong>Necesare</strong> — un cookie de sesiune pentru autentificare
          și un cookie pentru a-ți reține preferința de limbă. Acestea sunt
          setate întotdeauna.
        </li>
        <li>
          <strong>Analiză</strong> — cookie-uri setate de Google Analytics și
          Vercel Analytics pentru a măsura utilizarea. Acestea sunt setate doar
          dacă accepți cookie-uri de analiză.
        </li>
      </ul>
      <p>
        Îți poți schimba preferințele de cookie-uri oricând pe pagina{" "}
        <a href="/cookies/ro">Politica de cookie-uri</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Întrebări? Scrie la{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </LegalDocument>
  );
}
