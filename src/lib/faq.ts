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
    {
      question: "Why does Mintdish put prep steps before cooking steps?",
      answer:
        "Real cooking is faster and calmer when everything is chopped, measured, and ready before the heat is on. Mintdish reorders any recipe into prep-first format — every chop, dice, marinade, or rest happens before the cooking starts, and each cooking step lists only the ingredients needed at that moment.",
    },
    {
      question: "Does Mintdish convert cups and ounces to grams?",
      answer:
        "Yes. Every parsed recipe is converted to metric: cups, ounces, tablespoons, sticks of butter, and pints become grams and millilitres. The conversions are ingredient-aware (a cup of flour and a cup of water do not weigh the same), so the numbers are usable, not just multiplied.",
    },
    {
      question: "Can I parse a recipe from a photo of a cookbook page?",
      answer:
        "Yes. Take a photo of a cookbook page, a handwritten recipe card, or a screenshot from a chat — Mintdish reads the image with Gemini vision, structures it, and uses the original photo as the recipe's hero image. Photos are stored privately and only served back to you through an authenticated proxy.",
    },
    {
      question: "Are AI-generated recipe images labelled?",
      answer:
        "Yes. Any hero image generated on-demand by Mintdish using Gemini 2.5 Flash Image is watermarked with a small \"Generated with AI\" label so it can never be confused with a real photo.",
    },
    {
      question: "Which recipe sites does Mintdish work with?",
      answer:
        "Mintdish works with most modern recipe blogs and cooking sites — Bon Appétit, Serious Eats, NYT Cooking, Food52, BBC Good Food, Smitten Kitchen, and many smaller blogs. If a site uses standard Recipe schema or has a readable recipe block, Mintdish will parse it.",
    },
    {
      question: "Can I scale a recipe to a different number of servings?",
      answer:
        "Yes. Each saved recipe has a serving count you can change, and Mintdish rescales every quantity in the ingredient list and per-step ingredients to match. The original recipe is always one click away if you want to compare.",
    },
    {
      question: "Can I edit a parsed recipe after Mintdish creates it?",
      answer:
        "Yes. Every recipe has a built-in chat where you can ask Mintdish to swap ingredients, change a technique, scale a step, or fix something it got wrong. You can also revert to the originally parsed version any time.",
    },
    {
      question: "Does Mintdish train AI models on my recipes or photos?",
      answer:
        "No. Your saved recipes and uploaded photos are private to your account. Recipe content is sent to Google Gemini for parsing and chat, under Google's API terms — Mintdish does not train any models of its own and does not share your library with third parties beyond what is required to deliver the service.",
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
    {
      question: "De ce pune Mintdish pașii de preparare înaintea celor de gătit?",
      answer:
        "Gătitul real este mai rapid și mai calm când tot ce trebuie tocat, măsurat sau marinat este pregătit înainte să pornești focul. Mintdish rearanjează orice rețetă în format „prep-first”: fiecare tocare, marinare sau pauză apare înainte de gătit, iar fiecare pas de gătit listează doar ingredientele de care ai nevoie chiar atunci.",
    },
    {
      question: "Convertește Mintdish căni și uncii în grame?",
      answer:
        "Da. Fiecare rețetă procesată este convertită în sistem metric: căni, uncii, linguri, „stick” de unt și pinte devin grame și mililitri. Conversiile țin cont de ingredient (o cană de făină și o cană de apă nu cântăresc la fel), așa că numerele sunt utilizabile, nu doar înmulțite.",
    },
    {
      question: "Pot procesa o rețetă dintr-o poză a unei pagini de carte?",
      answer:
        "Da. Fă o poză unei pagini din carte, unei rețete scrise de mână sau unei capturi de ecran dintr-un chat — Mintdish citește imaginea cu Gemini vision, o structurează și folosește poza originală drept imagine a rețetei. Pozele sunt stocate privat și sunt servite înapoi doar către tine printr-un proxy autentificat.",
    },
    {
      question: "Sunt etichetate imaginile generate de AI?",
      answer:
        "Da. Orice imagine generată la cerere de Mintdish folosind Gemini 2.5 Flash Image are un mic filigran „Generated with AI”, ca să nu fie confundată niciodată cu o fotografie reală.",
    },
    {
      question: "Cu ce site-uri de rețete funcționează Mintdish?",
      answer:
        "Mintdish funcționează cu majoritatea blogurilor și site-urilor moderne de gătit — Bon Appétit, Serious Eats, NYT Cooking, Food52, BBC Good Food, Smitten Kitchen și multe bloguri mai mici. Dacă un site folosește schema Recipe standard sau are un bloc de rețetă lizibil, Mintdish îl va procesa.",
    },
    {
      question: "Pot scala o rețetă la alt număr de porții?",
      answer:
        "Da. Fiecare rețetă salvată are un număr de porții pe care îl poți schimba, iar Mintdish rescalează toate cantitățile din lista de ingrediente și din pașii individuali. Versiunea originală este oricând la un click distanță dacă vrei să compari.",
    },
    {
      question: "Pot edita o rețetă procesată după ce a fost creată?",
      answer:
        "Da. Fiecare rețetă are un chat încorporat unde îi poți cere lui Mintdish să schimbe un ingredient, să modifice o tehnică, să scaleze un pas sau să corecteze ceva ce a interpretat greșit. Poți reveni oricând la versiunea originală procesată.",
    },
    {
      question: "Antrenează Mintdish modele AI pe rețetele sau pozele mele?",
      answer:
        "Nu. Rețetele salvate și pozele încărcate sunt private contului tău. Conținutul este trimis către Google Gemini pentru procesare și chat, conform termenilor API ai Google — Mintdish nu antrenează modele proprii și nu partajează biblioteca ta cu terți în afară de ce este necesar pentru serviciu.",
    },
  ],
};

const content: Record<Locale, FaqContent> = { en, ro };

export function getFaqContent(locale: Locale): FaqContent {
  return content[locale];
}
