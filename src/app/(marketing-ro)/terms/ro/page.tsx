import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  alternates: {
    canonical: "/terms/ro",
    languages: { en: "/terms", ro: "/terms/ro" },
  },
};

export default function TermsOfServiceRo() {
  return (
    <LegalDocument>
      <h1>Termeni și condiții</h1>
      <p className="text-gray-500">Ultima actualizare: 4 mai 2026</p>

      <h2>Acceptare</h2>
      <p>
        Folosind Mintdish, ești de acord cu acești termeni. Dacă nu ești de
        acord, te rugăm să nu folosești serviciul.
      </p>

      <h2>Serviciul</h2>
      <p>
        Mintdish este un organizator personal de rețete. Îl oferim ca atare,
        fără garanții privind disponibilitatea sau păstrarea datelor. Facem tot
        posibilul să-ți păstrăm datele în siguranță, dar îți recomandăm să faci
        copii de rezervă pentru ce este important.
      </p>

      <h2>Conținutul tău</h2>
      <p>
        Rețetele și datele pe care le stochezi în Mintdish îți aparțin. Nu
        revendicăm niciun drept asupra conținutului tău. Putem procesa
        conținutul tău prin servicii AI terțe (Google Gemini) pentru a oferi
        funcționalități precum analiza rețetelor și chat-ul.
      </p>

      <h2>Utilizare acceptabilă</h2>
      <p>Nu folosi Mintdish pentru a:</p>
      <ul>
        <li>Stoca sau distribui conținut ilegal</li>
        <li>Spama alți utilizatori cu distribuiri nesolicitate</li>
        <li>Încerca să accesezi datele altor utilizatori</li>
        <li>Abuza serviciul în moduri care îl degradează pentru alții</li>
      </ul>

      <h2>Reziliere</h2>
      <p>
        Putem suspenda sau șterge conturi care încalcă acești termeni. Îți poți
        șterge contul oricând contactându-ne la{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>

      <h2>Răspundere</h2>
      <p>
        Mintdish este oferit „ca atare”, fără garanție. Nu suntem răspunzători
        pentru daunele care decurg din utilizarea serviciului.
      </p>

      <h2>Modificări</h2>
      <p>
        Putem actualiza acești termeni. Utilizarea continuă după modificări
        constituie acceptarea lor.
      </p>

      <h2>Contact</h2>
      <p>
        Întrebări? Scrie la{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </LegalDocument>
  );
}
