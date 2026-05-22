import type { Locale } from "@/lib/i18n";

const PATHS: Record<
  Locale,
  { faq: string; privacy: string; terms: string; cookies: string }
> = {
  en: {
    faq: "/faq",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
  },
  ro: {
    faq: "/faq/ro",
    privacy: "/privacy/ro",
    terms: "/terms/ro",
    cookies: "/cookies/ro",
  },
};

export function Footer({
  locale,
  faqLabel,
  privacyLabel,
  termsLabel,
  cookiesLabel,
}: {
  locale: Locale;
  faqLabel: string;
  privacyLabel: string;
  termsLabel: string;
  cookiesLabel: string;
}) {
  const paths = PATHS[locale];

  return (
    <footer className="mt-auto border-t border-gray-100 py-4 text-center text-xs text-gray-600">
      <a href={paths.faq} className="hover:text-gray-900">
        {faqLabel}
      </a>
      <span className="mx-2">·</span>
      <a href={paths.privacy} className="hover:text-gray-900">
        {privacyLabel}
      </a>
      <span className="mx-2">·</span>
      <a href={paths.terms} className="hover:text-gray-900">
        {termsLabel}
      </a>
      <span className="mx-2">·</span>
      <a href={paths.cookies} className="hover:text-gray-900">
        {cookiesLabel}
      </a>
    </footer>
  );
}
