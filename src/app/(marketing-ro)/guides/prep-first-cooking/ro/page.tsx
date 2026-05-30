import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingArticle } from "@/components/MarketingArticle";
import {
  articleStructuredData,
  breadcrumbStructuredData,
} from "@/lib/structured-data";
import { PAGES } from "@/lib/site-pages";

const TITLE = "Metoda prep-first: gătești calm, termini mai repede";
const DESCRIPTION =
  "De ce orice școală de bucătărie predă mise en place și cum să rearanjezi orice rețetă astfel încât tocatul, măsuratul și odihna să se întâmple înainte de a porni focul.";
const URL_PATH = "/guides/prep-first-cooking/ro";
const { published: PUBLISHED, modified: MODIFIED } =
  PAGES["/guides/prep-first-cooking"];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: URL_PATH,
    languages: {
      en: "/guides/prep-first-cooking",
      ro: URL_PATH,
      "x-default": "/guides/prep-first-cooking",
    },
  },
  openGraph: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
  twitter: { title: `${TITLE} — Mintdish`, description: DESCRIPTION },
};

export default function GuidePrepFirstRo() {
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
          Gătitul devine stresant când toci usturoi, urmărești tigaia, măsori
          sos de soia și încerci să-ți amintești ce urmează — toate în același
          timp. Soluția e cel mai vechi truc din bucătăriile profesioniste:
          termini toată prepararea înainte de a porni gătitul. Acest ghid
          explică de ce funcționează și cum se aplică pe orice rețetă.
        </p>

        <h2>Ce înseamnă „prep-first”</h2>
        <p>
          Prep-first — bucătarii o numesc <em>mise en place</em> — înseamnă să
          faci toate sarcinile fără foc înainte de a porni aragazul. Speli,
          toci, măsori, marinezi, lași la odihnă și preîncălzești cuptorul mai
          întâi. Gătitul devine apoi o secvență scurtă și concentrată: iei un
          bol pre-măsurat și-l torni în tigaie la momentul potrivit.
        </p>

        <h2>De ce te face mai rapid, nu mai lent</h2>
        <ul>
          <li>
            <strong>Fără context switching.</strong> Să toci în timp ce se
            încălzește tigaia pare eficient, până când se arde usturoiul. Faci
            câte o sarcină odată și termini totul mai repede.
          </li>
          <li>
            <strong>Mai puține greșeli.</strong> Ingredientele pre-măsurate în
            boluri etichetate elimină pauza „a fost lingură sau linguriță?”.
          </li>
          <li>
            <strong>Timing mai bun.</strong> Când gătitul devine o secvență
            strânsă, sosurile se reduc, legumele rămân crocante și carnea nu se
            răstoarnă așteptând următorul ingredient.
          </li>
        </ul>

        <h2>Cum rearanjezi orice rețetă</h2>
        <ol>
          <li>Citește rețeta cap-coadă înainte să începi.</li>
          <li>
            Listează fiecare ingredient prin starea sa de preparare — „ceapă,
            tăiată cubulețe”, nu „1 ceapă”.
          </li>
          <li>
            Grupează tocatul, curățatul, mărunțitul, marinarea și odihna în
            partea de sus.
          </li>
          <li>Pre-măsoară fiecare condiment și lichid în boluri mici.</li>
          <li>
            Acum citește partea de gătit — ar trebui să încapă pe un singur
            ecran.
          </li>
        </ol>

        <h2>Scurtătura</h2>
        <p>
          <a href="/welcome/ro">Mintdish</a> rearanjează orice rețetă procesată
          în format prep-first automat. Pașii de preparare sunt grupați la
          început, gătitul vine după, iar fiecare pas de gătit listează exact
          ingredientele de care ai nevoie — fără să mai derulezi sus în timp ce
          ceva fierbe.
        </p>

        <p>
          Pentru mai multe despre parser, vezi{" "}
          <a href="/how-it-works/ro">Cum funcționează Mintdish</a>.
        </p>
      </MarketingArticle>
    </>
  );
}
