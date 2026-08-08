import type { Translations } from "@/lib/i18n";

// parseError holds either a known reason key or literal error text (admin
// account). Known keys translate; anything else is shown verbatim.
export function parseErrorMessage(
  parseError: string | null,
  t: Translations,
): string {
  switch (parseError) {
    case "no-recipe-found":
      return t.errorNoRecipeFound;
    case "parse-interrupted":
      return t.errorParseInterrupted;
    case "parse-failed":
    case null:
      return t.errorParseFailed;
    default:
      return parseError;
  }
}
