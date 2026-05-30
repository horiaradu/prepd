import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/Providers";
import { AppHeader } from "@/components/AppHeader";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { MarketingFooter } from "@/components/MarketingFooter";
import { getTranslations } from "@/lib/i18n";
import { siteMetadata, siteViewport } from "@/lib/site-metadata";
import "../globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
});

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function MarketingEnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = getTranslations("en");

  return (
    <html lang="en" className={`${jakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers locale="en">
          <Suspense fallback={null}>
            <AnalyticsPageView />
          </Suspense>
          <AppHeader />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
        <MarketingFooter
          locale="en"
          tagline={t.footerTagline}
          productHeading={t.footerProductHeading}
          legalHeading={t.footerLegalHeading}
          howItWorksLabel={t.howItWorks}
          guidesLabel={t.guides}
          faqLabel={t.faq}
          aboutLabel={t.about}
          securityLabel={t.security}
          privacyLabel={t.privacy}
          termsLabel={t.terms}
          cookiesLabel={t.cookies}
        />
      </body>
    </html>
  );
}
