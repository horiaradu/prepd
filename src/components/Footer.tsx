import type { Locale } from "@/lib/i18n";

const PATHS: Record<
  Locale,
  {
    faq: string;
    privacy: string;
    terms: string;
    cookies: string;
  }
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

  const links = [
    { href: paths.faq, label: faqLabel },
    { href: paths.privacy, label: privacyLabel },
    { href: paths.terms, label: termsLabel },
    { href: paths.cookies, label: cookiesLabel },
  ];

  return (
    <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-600">
      <nav
        aria-label="Legal"
        className="flex flex-wrap justify-center gap-x-2 gap-y-1"
      >
        {links.map((link, index) => (
          <span key={link.href} className="flex items-center gap-2">
            <a href={link.href} className="hover:text-gray-900">
              {link.label}
            </a>
            {index < links.length - 1 && <span aria-hidden>·</span>}
          </span>
        ))}
      </nav>
    </footer>
  );
}
