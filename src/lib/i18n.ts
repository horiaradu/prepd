export const LOCALES = ["en", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isValidLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getLocaleFromHeader(acceptLanguage: string): Locale {
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? "";
    if (tag.startsWith("ro")) return "ro";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

export type Translations = {
  // Layout / footer
  privacy: string;
  terms: string;

  // Header
  signIn: string;
  backAriaLabel: string;
  inboxAriaLabel: string;
  codesAriaLabel: string;
  enableNotifications: string;
  reEnableNotifications: string;
  notificationBlockedHint: string;
  signOut: string;

  // Landing — hero
  heroLine1: string;
  heroLine2: string;
  heroSubtitle: string;
  joinWaitlist: string;

  // Landing — input modes section
  fromWhereverFound: string;
  oneInputThreeWays: string;
  badgeLink: string;
  recipeSites: string;
  recipeSitesDesc: string;
  badgeYoutube: string;
  cookingVideos: string;
  cookingVideosDesc: string;
  badgePhoto: string;
  cookbookPages: string;
  cookbookPagesDesc: string;

  // Landing — output showcase
  structuredNotScraped: string;
  ingredientsStepsTiming: string;
  perStepIngredients: string;
  perStepIngredientsDesc: string;
  metricConversions: string;
  metricConversionsDesc: string;
  timingBuiltIn: string;
  timingBuiltInDesc: string;
  scaleServings: string;
  scaleServingsDesc: string;

  // Landing — waitlist
  getOnWaitlist: string;
  waitlistSubtitle: string;

  // WaitlistForm
  emailPlaceholder: string;
  requestInvite: string;
  thankYou: string;
  waitlistError: string;
  alreadyHaveAccount: string;

  // Login
  signInToAccess: string;
  accessDenied: string;
  signInWithGoogle: string;

  // RecipeInput
  pasteRecipeLink: string;
  uploadPhotoTitle: string;
  parse: string;
  parsing: string;
  starting: string;
  preparingPhotos: string;
  somethingWentWrong: string;

  // Parse progress steps (sent from API routes via SSE)
  stepExtractingContent: string;
  stepAnalyzingVideo: string;
  stepAnalyzingRecipe: string;
  stepAnalyzingRecipeFromUrl: string;
  stepSavingRecipe: string;
  stepProcessingImages: string;
  stepReadingRecipe: string;
  stepGeneratingRecipe: string;

  // RecipeList
  suggestRecipes: string;
  filterRecipes: string;
  noRecipesYet: string;
  sourceYouTube: string;
  sourceWeb: string;

  // RecipeDisplay
  serves: string;
  reset: string;
  ingredients: string;
  preparation: string;
  cooking: string;
  watchAt: string;
  toTaste: string;

  // RecipeDetails
  viewingOriginal: string;
  showingPreview: string;
  viewCurrent: string;
  viewOriginal: string;
  reparse: string;
  reparsing: string;
  source: string;
  generateImage: string;
  regenerateImage: string;
  image: string;
  generating: string;
  share: string;
  delete: string;
  deleting: string;
  deleteRecipeTitle: string;
  deleteRecipeMessage: string;
  undo: string;
  undoing: string;
  tweakPlaceholder: string;
  applyChanges: string;
  applying: string;
  discard: string;
  thinking: string;
  updateRecipe: string;
  iCookedThis: string;
  iCookedThisUpdate: string;
  failedToApply: string;
  failedToDiscard: string;
  nothingToUndo: string;
  failedToGenerateImage: string;

  // Inbox
  noSharedRecipes: string;
  inboxTitle: string;
  history: string;
  from: string;
  accept: string;
  statusAccepted: string;
  statusDiscarded: string;

  // ShareDialog
  shareRecipeTitle: string;
  recipeSharedWith: string;
  done: string;
  recipientEmail: string;
  cancel: string;
  sending: string;
  send: string;
  failedToShare: string;

  // Suggest page
  recipeSuggestions: string;
  whatMoodFor: string;
  searching: string;
  searchingForRecipes: string;
  askForRecipeIdeas: string;
  yourCollection: string;
  fromTheWeb: string;
  originalIdeas: string;
  noSuggestionsFromCollection: string;
  noWebRecipes: string;
  noOriginalIdeas: string;
  recipeFallbackTitle: string;
  saveRecipe: string;
  generateRecipeSuggest: string;
};

const en: Translations = {
  privacy: "Privacy",
  terms: "Terms",

  signIn: "Sign in",
  backAriaLabel: "Back",
  inboxAriaLabel: "Inbox",
  codesAriaLabel: "Invitations",
  enableNotifications: "Enable notifications",
  reEnableNotifications: "Re-enable notifications",
  notificationBlockedHint: "If blocked, update device settings then tap here",
  signOut: "Sign out",

  heroLine1: "Skip the food blog.",
  heroLine2: "Just the recipe.",
  heroSubtitle:
    "Paste a recipe link, drop a YouTube cooking video, or snap a photo. Mintdish parses it into clean ingredients, prep steps, and cooking times — ready to follow.",
  joinWaitlist: "Join the waitlist",

  fromWhereverFound: "From wherever you found it.",
  oneInputThreeWays:
    "One input, three ways in. Mintdish figures out which kind of source you handed it and pulls the recipe out.",
  badgeLink: "Link",
  recipeSites: "Recipe sites",
  recipeSitesDesc:
    "Bon Appétit, Serious Eats, Food52, NYT Cooking. Paste the link, get the recipe — without the 2,000-word backstory.",
  badgeYoutube: "YouTube",
  cookingVideos: "Cooking videos",
  cookingVideosDesc:
    "Mintdish reads the transcript, watches what gets cooked, and turns it into step-by-step instructions with ingredients.",
  badgePhoto: "Photo",
  cookbookPages: "Cookbook pages & screenshots",
  cookbookPagesDesc:
    "Snap a page from a cookbook, screenshot a friend's text, or upload a handwritten card — Mintdish reads it.",

  structuredNotScraped: "Structured, not scraped",
  ingredientsStepsTiming:
    "Ingredients, steps, and timing — laid out for cooking.",
  perStepIngredients: "Per-step ingredients",
  perStepIngredientsDesc:
    "Every step shows exactly which ingredients to grab — no jumping back to the top.",
  metricConversions: "Metric conversions",
  metricConversionsDesc:
    "Cups, ounces, sticks of butter — all converted to grams and millilitres.",
  timingBuiltIn: "Timing built in",
  timingBuiltInDesc:
    "Cooking times surface as badges so you know what's a two-minute task and what's a forty-minute simmer.",
  scaleServings: "Scale your servings",
  scaleServingsDesc: "Bump the serving size and the amounts scale with you.",

  getOnWaitlist: "Get on the waitlist.",
  waitlistSubtitle:
    "Mintdish is invite-only while we tune the parser. Drop your email — we'll keep you in the loop at launch and get you into beta early.",

  emailPlaceholder: "you@example.com",
  requestInvite: "Request invite",
  thankYou: "Thanks — we'll be in touch.",
  waitlistError: "Something went wrong. Please try again.",
  alreadyHaveAccount: "Already have an account? Sign in",

  signInToAccess: "Sign in to access your recipes",
  accessDenied: "Access denied. Only authorized accounts can sign in.",
  signInWithGoogle: "Sign in with Google",

  pasteRecipeLink: "Paste a recipe or YouTube link",
  uploadPhotoTitle: "Upload a photo of a recipe",
  parse: "Parse",
  parsing: "Parsing…",
  starting: "Starting…",
  preparingPhotos: "Preparing photos…",
  somethingWentWrong: "Something went wrong",

  suggestRecipes: "Suggest recipes",
  filterRecipes: "Filter recipes…",
  noRecipesYet: "No recipes yet. Paste a URL above to get started.",
  sourceYouTube: "YouTube",
  sourceWeb: "Web",

  serves: "Serves",
  reset: "Reset",
  ingredients: "Ingredients",
  preparation: "Preparation",
  cooking: "Cooking",
  watchAt: "▶ Watch at {time}",
  toTaste: "to taste",

  viewingOriginal: "Viewing the original recipe as first parsed",
  showingPreview: "Showing a preview — apply to save or discard to go back",
  viewCurrent: "View current",
  viewOriginal: "View original",
  reparse: "Re-parse",
  reparsing: "Re-parsing…",
  source: "Source",
  generateImage: "Generate image",
  regenerateImage: "Regenerate image",
  image: "Image",
  generating: "Generating…",
  share: "Share",
  delete: "Delete",
  deleting: "Deleting…",
  deleteRecipeTitle: "Delete this recipe?",
  deleteRecipeMessage: "This action cannot be undone.",
  undo: "Undo",
  undoing: "Undoing…",
  tweakPlaceholder:
    "Tweak the recipe… e.g. 'use coconut milk instead of cream' or 'double the garlic'",
  applyChanges: "Apply changes",
  applying: "Applying…",
  discard: "Discard",
  thinking: "Thinking…",
  updateRecipe: "Update recipe",
  iCookedThis: "I cooked this",
  iCookedThisUpdate: "I cooked this + update",
  failedToApply: "Failed to apply changes",
  failedToDiscard: "Failed to discard",
  nothingToUndo: "Nothing to undo",
  failedToGenerateImage: "Failed to generate image",

  noSharedRecipes: "No shared recipes yet",
  inboxTitle: "Inbox",
  history: "History",
  from: "From {name}",
  accept: "Accept",
  statusAccepted: "accepted",
  statusDiscarded: "discarded",

  shareRecipeTitle: "Share recipe",
  recipeSharedWith: "Recipe shared with {email}!",
  done: "Done",
  recipientEmail: "Recipient email",
  cancel: "Cancel",
  sending: "Sending…",
  send: "Send",
  failedToShare: "Failed to share",

  recipeSuggestions: "Recipe suggestions",
  whatMoodFor: "What are you in the mood for?",
  searching: "Searching…",
  searchingForRecipes: "Searching for recipes…",
  askForRecipeIdeas:
    "Ask me for recipe ideas — I'll search the web and suggest based on your cooking history.",
  yourCollection: "Your collection",
  fromTheWeb: "From the web",
  originalIdeas: "Original ideas",
  noSuggestionsFromCollection: "No suggestions from your collection.",
  noWebRecipes: "No web recipes found.",
  noOriginalIdeas: "No original ideas suggested.",
  recipeFallbackTitle: "Recipe",
  saveRecipe: "Save recipe",
  generateRecipeSuggest: "Generate recipe",

  stepExtractingContent: "Extracting content…",
  stepAnalyzingVideo: "Analyzing video…",
  stepAnalyzingRecipe: "Analyzing recipe…",
  stepAnalyzingRecipeFromUrl: "Analyzing recipe from URL…",
  stepSavingRecipe: "Saving recipe…",
  stepProcessingImages: "Processing images…",
  stepReadingRecipe: "Reading recipe…",
  stepGeneratingRecipe: "Generating recipe…",
};

const ro: Translations = {
  privacy: "Confidențialitate",
  terms: "Termeni",

  signIn: "Autentificare",
  backAriaLabel: "Înapoi",
  inboxAriaLabel: "Inbox",
  codesAriaLabel: "Invitații",
  enableNotifications: "Activează notificările",
  reEnableNotifications: "Reactivează notificările",
  notificationBlockedHint:
    "Dacă este blocat, actualizați setările dispozitivului, apoi atingeți aici",
  signOut: "Deconectare",

  heroLine1: "Sari peste blogul culinar.",
  heroLine2: "Direct rețeta.",
  heroSubtitle:
    "Lipești un link la rețetă, dai un video YouTube de gătit sau faci o poză. Mintdish o transformă în ingrediente curate, pași de preparare și timpi de gătit — gata de urmat.",
  joinWaitlist: "Înscrie-te pe lista de așteptare",

  fromWhereverFound: "De oriunde ai găsit-o.",
  oneInputThreeWays:
    "Un singur câmp, trei moduri de introducere. Mintdish îți dă seama ce tip de sursă i-ai dat și extrage rețeta.",
  badgeLink: "Link",
  recipeSites: "Site-uri de rețete",
  recipeSitesDesc:
    "Bon Appétit, Serious Eats, Food52, NYT Cooking. Lipești linkul, obții rețeta — fără introducerea de 2.000 de cuvinte.",
  badgeYoutube: "YouTube",
  cookingVideos: "Videoclipuri de gătit",
  cookingVideosDesc:
    "Mintdish citește transcriptul, urmărește ce se gătește și transformă totul în instrucțiuni pas cu pas cu ingrediente.",
  badgePhoto: "Poză",
  cookbookPages: "Pagini din cărți de bucate și capturi de ecran",
  cookbookPagesDesc:
    "Fotografiezi o pagină dintr-o carte de bucate, faci o captură de ecran sau încarci un rețetar scris de mână — Mintdish îl citește.",

  structuredNotScraped: "Structurată, nu extrasă la întâmplare",
  ingredientsStepsTiming:
    "Ingrediente, pași și timpi — organizați pentru gătit.",
  perStepIngredients: "Ingrediente per pas",
  perStepIngredientsDesc:
    "Fiecare pas arată exact ce ingrediente să iei — nu mai sari înapoi la lista de sus.",
  metricConversions: "Conversii metrice",
  metricConversionsDesc:
    "Căni, uncii, batoane de unt — toate convertite în grame și mililitri.",
  timingBuiltIn: "Timpi incluși",
  timingBuiltInDesc:
    "Timpii de gătit apar ca insigne, ca să știi ce durează două minute și ce durează patruzeci.",
  scaleServings: "Ajustează porțiile",
  scaleServingsDesc:
    "Mărești numărul de porții și cantitățile se ajustează automat.",

  getOnWaitlist: "Înscrie-te pe lista de așteptare.",
  waitlistSubtitle:
    "Mintdish funcționează doar pe bază de invitație în timp ce perfecționăm parserul. Lasă adresa de email — te vom ține la curent la lansare și te vom introduce devreme în beta.",

  emailPlaceholder: "tu@exemplu.com",
  requestInvite: "Solicită invitație",
  thankYou: "Mulțumim — te vom contacta.",
  waitlistError: "Ceva nu a mers bine. Te rugăm să încerci din nou.",
  alreadyHaveAccount: "Ai deja un cont? Autentifică-te",

  signInToAccess: "Autentifică-te pentru a accesa rețetele tale",
  accessDenied: "Acces refuzat. Doar conturile autorizate se pot autentifica.",
  signInWithGoogle: "Autentificare cu Google",

  pasteRecipeLink: "Lipește un link la rețetă sau YouTube",
  uploadPhotoTitle: "Încarcă o fotografie a rețetei",
  parse: "Procesează",
  parsing: "Se procesează…",
  starting: "Se pornește…",
  preparingPhotos: "Se pregătesc fotografiile…",
  somethingWentWrong: "Ceva nu a mers bine",

  suggestRecipes: "Sugerează rețete",
  filterRecipes: "Filtrează rețete…",
  noRecipesYet: "Nicio rețetă încă. Lipește un URL mai sus pentru a începe.",
  sourceYouTube: "YouTube",
  sourceWeb: "Web",

  serves: "Porții",
  reset: "Resetează",
  ingredients: "Ingrediente",
  preparation: "Preparare",
  cooking: "Gătit",
  watchAt: "▶ Vezi la {time}",
  toTaste: "după gust",

  viewingOriginal:
    "Vizualizezi rețeta originală, așa cum a fost procesată inițial",
  showingPreview:
    "Previzualizare — aplică pentru a salva sau renunță pentru a reveni",
  viewCurrent: "Vizualizează curentă",
  viewOriginal: "Vizualizează originală",
  reparse: "Reprocesează",
  reparsing: "Se reprocesează…",
  source: "Sursă",
  generateImage: "Generează imagine",
  regenerateImage: "Regenerează imaginea",
  image: "Imagine",
  generating: "Se generează…",
  share: "Distribuie",
  delete: "Șterge",
  deleting: "Se șterge…",
  deleteRecipeTitle: "Ștergi această rețetă?",
  deleteRecipeMessage: "Această acțiune nu poate fi anulată.",
  undo: "Anulează",
  undoing: "Se anulează…",
  tweakPlaceholder:
    "Modifică rețeta… ex. 'folosește lapte de cocos în loc de frișcă' sau 'dublează usturoiul'",
  applyChanges: "Aplică modificările",
  applying: "Se aplică…",
  discard: "Renunță",
  thinking: "Se gândește…",
  updateRecipe: "Actualizează rețeta",
  iCookedThis: "Am gătit asta",
  iCookedThisUpdate: "Am gătit asta + actualizează",
  failedToApply: "Nu s-au putut aplica modificările",
  failedToDiscard: "Nu s-a putut renunța",
  nothingToUndo: "Nimic de anulat",
  failedToGenerateImage: "Nu s-a putut genera imaginea",

  noSharedRecipes: "Nicio rețetă partajată încă",
  inboxTitle: "Inbox",
  history: "Istoric",
  from: "De la {name}",
  accept: "Acceptă",
  statusAccepted: "acceptată",
  statusDiscarded: "respinsă",

  shareRecipeTitle: "Distribuie rețeta",
  recipeSharedWith: "Rețetă distribuită către {email}!",
  done: "Gata",
  recipientEmail: "Emailul destinatarului",
  cancel: "Anulează",
  sending: "Se trimite…",
  send: "Trimite",
  failedToShare: "Nu s-a putut distribui",

  recipeSuggestions: "Sugestii de rețete",
  whatMoodFor: "Ce ai chef să gătești?",
  searching: "Se caută…",
  searchingForRecipes: "Se caută rețete…",
  askForRecipeIdeas:
    "Întreabă-mă pentru idei de rețete — voi căuta pe web și voi sugera pe baza istoricului tău de gătit.",
  yourCollection: "Colecția ta",
  fromTheWeb: "De pe web",
  originalIdeas: "Idei originale",
  noSuggestionsFromCollection: "Nicio sugestie din colecția ta.",
  noWebRecipes: "Nicio rețetă găsită pe web.",
  noOriginalIdeas: "Nicio idee originală sugerată.",
  recipeFallbackTitle: "Rețetă",
  saveRecipe: "Salvează rețeta",
  generateRecipeSuggest: "Generează rețeta",

  stepExtractingContent: "Se extrage conținutul…",
  stepAnalyzingVideo: "Se analizează videoclipul…",
  stepAnalyzingRecipe: "Se analizează rețeta…",
  stepAnalyzingRecipeFromUrl: "Se analizează rețeta din URL…",
  stepSavingRecipe: "Se salvează rețeta…",
  stepProcessingImages: "Se procesează imaginile…",
  stepReadingRecipe: "Se citește rețeta…",
  stepGeneratingRecipe: "Se generează rețeta…",
};

const dictionaries: Record<Locale, Translations> = { en, ro };

export function getTranslations(locale: Locale | string): Translations {
  const l = isValidLocale(locale) ? locale : "en";
  return dictionaries[l];
}

export function getLocaleName(locale: Locale): string {
  return locale === "ro" ? "RO" : "EN";
}
