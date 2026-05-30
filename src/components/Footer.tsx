import type { Locale } from "@/lib/i18n";

const PATHS: Record<
  Locale,
  {
    faq: string;
    privacy: string;
    terms: string;
    cookies: string;
    howItWorks: string;
    guides: string;
    about: string;
    security: string;
  }
> = {
  en: {
    faq: "/faq",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    howItWorks: "/how-it-works",
    guides: "/guides",
    about: "/about",
    security: "/security",
  },
  ro: {
    faq: "/faq/ro",
    privacy: "/privacy/ro",
    terms: "/terms/ro",
    cookies: "/cookies/ro",
    howItWorks: "/how-it-works/ro",
    guides: "/guides/ro",
    about: "/about/ro",
    security: "/security/ro",
  },
};

export function Footer({
  locale,
  faqLabel,
  privacyLabel,
  termsLabel,
  cookiesLabel,
  howItWorksLabel,
  guidesLabel,
  aboutLabel,
  securityLabel,
}: {
  locale: Locale;
  faqLabel: string;
  privacyLabel: string;
  termsLabel: string;
  cookiesLabel: string;
  howItWorksLabel?: string;
  guidesLabel?: string;
  aboutLabel?: string;
  securityLabel?: string;
}) {
  const paths = PATHS[locale];

  const productLinks: Array<{ href: string; label?: string }> = [
    { href: paths.howItWorks, label: howItWorksLabel },
    { href: paths.guides, label: guidesLabel },
    { href: paths.faq, label: faqLabel },
    { href: paths.about, label: aboutLabel },
  ].filter((l): l is { href: string; label: string } => Boolean(l.label));

  const legalLinks: Array<{ href: string; label?: string }> = [
    { href: paths.security, label: securityLabel },
    { href: paths.privacy, label: privacyLabel },
    { href: paths.terms, label: termsLabel },
    { href: paths.cookies, label: cookiesLabel },
  ].filter((l): l is { href: string; label: string } => Boolean(l.label));

  return (
    <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-600">
      {productLinks.length > 0 && (
        <nav
          aria-label="Product"
          className="flex flex-wrap justify-center gap-x-2 gap-y-1"
        >
          {productLinks.map((link, index) => (
            <span key={link.href} className="flex items-center gap-2">
              <a href={link.href} className="hover:text-gray-900">
                {link.label}
              </a>
              {index < productLinks.length - 1 && <span aria-hidden>·</span>}
            </span>
          ))}
        </nav>
      )}
      <nav
        aria-label="Legal"
        className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1"
      >
        {legalLinks.map((link, index) => (
          <span key={link.href} className="flex items-center gap-2">
            <a href={link.href} className="hover:text-gray-900">
              {link.label}
            </a>
            {index < legalLinks.length - 1 && <span aria-hidden>·</span>}
          </span>
        ))}
      </nav>
    </footer>
  );
}
