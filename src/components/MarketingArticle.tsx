import type { ReactNode } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type Crumb = { name: string; href?: string };

export function MarketingArticle({
  locale,
  breadcrumbs,
  children,
}: {
  locale: Locale;
  breadcrumbs?: Crumb[];
  children: ReactNode;
}) {
  return (
    <article className="px-6 sm:px-8 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto space-y-6 text-gray-700 leading-relaxed [&_h1]:text-3xl sm:[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-gray-900 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:text-gray-700 [&_a]:text-green-700 [&_a]:underline">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label={locale === "ro" ? "Firul Ariadnei" : "Breadcrumb"}
            className="text-xs text-gray-500"
          >
            <ol className="flex flex-wrap gap-1 list-none p-0">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.name}-${index}`} className="flex items-center gap-1">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-gray-900 underline-offset-2"
                    >
                      {crumb.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-gray-700">
                      {crumb.name}
                    </span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span aria-hidden className="text-gray-300">
                      ›
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {children}
      </div>
    </article>
  );
}
