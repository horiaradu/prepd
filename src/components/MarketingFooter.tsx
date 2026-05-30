import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const PATHS: Record<
  Locale,
  {
    home: string;
    howItWorks: string;
    guides: string;
    faq: string;
    about: string;
    security: string;
    privacy: string;
    terms: string;
    cookies: string;
  }
> = {
  en: {
    home: "/welcome",
    howItWorks: "/how-it-works",
    guides: "/guides",
    faq: "/faq",
    about: "/about",
    security: "/security",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
  },
  ro: {
    home: "/welcome/ro",
    howItWorks: "/how-it-works/ro",
    guides: "/guides/ro",
    faq: "/faq/ro",
    about: "/about/ro",
    security: "/security/ro",
    privacy: "/privacy/ro",
    terms: "/terms/ro",
    cookies: "/cookies/ro",
  },
};

const COPYRIGHT_YEAR = 2026;

export function MarketingFooter({
  locale,
  tagline,
  productHeading,
  legalHeading,
  howItWorksLabel,
  guidesLabel,
  faqLabel,
  aboutLabel,
  securityLabel,
  privacyLabel,
  termsLabel,
  cookiesLabel,
}: {
  locale: Locale;
  tagline: string;
  productHeading: string;
  legalHeading: string;
  howItWorksLabel: string;
  guidesLabel: string;
  faqLabel: string;
  aboutLabel: string;
  securityLabel: string;
  privacyLabel: string;
  termsLabel: string;
  cookiesLabel: string;
}) {
  const paths = PATHS[locale];

  const productLinks = [
    { href: paths.howItWorks, label: howItWorksLabel },
    { href: paths.guides, label: guidesLabel },
    { href: paths.faq, label: faqLabel },
    { href: paths.about, label: aboutLabel },
  ];

  const legalLinks = [
    { href: paths.security, label: securityLabel },
    { href: paths.privacy, label: privacyLabel },
    { href: paths.terms, label: termsLabel },
    { href: paths.cookies, label: cookiesLabel },
  ];

  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12">
          <div className="space-y-3">
            <Link href={paths.home} className="inline-flex items-center gap-2">
              <Image
                src="/icons/icon-nav.png"
                alt=""
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-base font-bold tracking-tight text-gray-900">
                Mintdish
              </span>
            </Link>
            <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
              {tagline}
            </p>
          </div>
          <FooterColumn heading={productHeading} links={productLinks} />
          <FooterColumn heading={legalHeading} links={legalLinks} />
        </div>
        <div className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-500">
          © {COPYRIGHT_YEAR} Mintdish
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
        {heading}
      </h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
