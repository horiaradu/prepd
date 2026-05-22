import type { Locale } from "@/lib/i18n";

export type FaqEntry = { question: string; answer: string };

type FaqContent = {
  title: string;
  intro: string;
  questions: FaqEntry[];
};

const en: FaqContent = {
  title: "Frequently asked questions",
  intro:
    "Quick answers about how Mintdish parses recipes, what you can paste, and how to join the beta.",
  questions: [
    {
      question: "What is Mintdish?",
      answer:
        "Mintdish takes a recipe from wherever you found it — a link, a YouTube video, or a photo — and turns it into a clean, structured recipe with ingredients, prep steps, and timing. No food-blog backstory.",
    },
    {
      question: "What can I paste into Mintdish?",
      answer:
        "Links from recipe sites like Bon Appétit, Serious Eats, NYT Cooking, and Food52; YouTube cooking videos; and photos or screenshots of cookbook pages, handwritten cards, or recipes a friend sent over text.",
    },
    {
      question: "Does Mintdish work with YouTube videos?",
      answer:
        "Yes. Mintdish reads the video transcript and watches what's being cooked, then turns it into step-by-step instructions with ingredients. Each step links back to the timestamp so you can jump to that moment in the video.",
    },
    {
      question: "How accurate is the recipe parsing?",
      answer:
        "Mintdish uses Google Gemini and recipe sites' structured metadata when available. Parsing is usually accurate for mainstream recipes; for handwritten cards or unusual sources, you can re-parse or tweak the result.",
    },
    {
      question: "Is Mintdish free?",
      answer:
        "Yes — Mintdish is free during the beta. We may introduce paid tiers later for heavy use, but the core recipe parser will remain free.",
    },
    {
      question: "Do I need an account?",
      answer:
        "Yes. You sign in with Google so your recipes are saved and synced across devices.",
    },
    {
      question: "How do I get access?",
      answer:
        "Mintdish is invite-only while we tune the parser. Drop your email on the waitlist on the home page and we'll let you in as we open up access.",
    },
    {
      question: "Can I share a parsed recipe with someone else?",
      answer:
        "Yes. From any recipe you can send a snapshot to someone by email — they'll receive the parsed ingredients, steps, and timing.",
    },
    {
      question: "What languages does Mintdish support?",
      answer:
        "The Mintdish interface is available in English and Romanian. The parser itself handles recipes from sources in many languages.",
    },
    {
      question: "Where is my data stored?",
      answer:
        "Recipes and account information are stored in a Postgres database hosted on Neon; images are stored on Vercel. Full details, including third parties involved in parsing and analytics, are listed in the Privacy Policy.",
    },
  ],
};

const ro: FaqContent = {
  title: "Întrebări frecvente",
  intro:
    "Răspunsuri rapide despre cum procesează Mintdish rețetele, ce poți să lipești și cum intri în beta.",
  questions: [
    {
      question: "Ce este Mintdish?",
      answer:
        "Mintdish ia o rețetă de oriunde ai găsit-o — un link, un videoclip YouTube sau o poză — și o transformă într-o rețetă curată și structurată, cu ingrediente, pași de preparare și timpi. Fără introducerea kilometrică a blogurilor culinare.",
    },
    {
      question: "Ce pot să lipesc în Mintdish?",
      answer:
        "Linkuri de pe site-uri de rețete precum Bon Appétit, Serious Eats, NYT Cooking sau Food52; videoclipuri YouTube de gătit; poze sau capturi de ecran cu pagini din cărți de bucate, rețete scrise de mână sau rețete trimise pe mesaj.",
    },
    {
      question: "Funcționează cu videoclipuri YouTube?",
      answer:
        "Da. Mintdish citește transcriptul videoclipului și urmărește ce se gătește, apoi transformă totul în instrucțiuni pas cu pas cu ingrediente. Fiecare pas are un link către momentul potrivit din videoclip.",
    },
    {
      question: "Cât de exactă este procesarea rețetelor?",
      answer:
        "Mintdish folosește Google Gemini și metadatele structurate ale site-urilor de rețete, când sunt disponibile. Pentru rețete mainstream rezultatul este de obicei foarte precis; pentru rețete scrise de mână sau surse neobișnuite, poți reprocesa sau modifica rezultatul.",
    },
    {
      question: "Este Mintdish gratuit?",
      answer:
        "Da — Mintdish este gratuit în perioada de beta. Este posibil să introducem mai târziu planuri plătite pentru utilizare intensă, dar parserul de rețete va rămâne gratuit.",
    },
    {
      question: "Am nevoie de cont?",
      answer:
        "Da. Te autentifici cu Google ca rețetele tale să fie salvate și sincronizate între dispozitive.",
    },
    {
      question: "Cum obțin acces?",
      answer:
        "Mintdish funcționează doar pe bază de invitație în timp ce perfecționăm parserul. Lasă adresa de email pe lista de așteptare de pe pagina principală și îți vom da acces pe măsură ce deschidem platforma.",
    },
    {
      question: "Pot să partajez o rețetă procesată cu cineva?",
      answer:
        "Da. Din orice rețetă poți trimite o copie prin email — destinatarul primește ingredientele, pașii și timpii procesați.",
    },
    {
      question: "Ce limbi suportă Mintdish?",
      answer:
        "Interfața Mintdish este disponibilă în engleză și română. Parserul în sine poate procesa rețete din surse în mai multe limbi.",
    },
    {
      question: "Unde sunt stocate datele mele?",
      answer:
        "Rețetele și datele contului sunt stocate într-o bază de date Postgres găzduită pe Neon; imaginile sunt stocate pe Vercel. Detaliile complete, inclusiv terțele părți implicate în procesare și analiză, sunt în Politica de confidențialitate.",
    },
  ],
};

const content: Record<Locale, FaqContent> = { en, ro };

export function getFaqContent(locale: Locale): FaqContent {
  return content[locale];
}
