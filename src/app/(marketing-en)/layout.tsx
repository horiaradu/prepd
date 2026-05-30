import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/Providers";
import { AppHeader } from "@/components/AppHeader";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { Footer } from "@/components/Footer";
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
        <Footer
          locale="en"
          faqLabel={t.faq}
          privacyLabel={t.privacy}
          termsLabel={t.terms}
          cookiesLabel={t.cookies}
          howItWorksLabel={t.howItWorks}
          guidesLabel={t.guides}
          aboutLabel={t.about}
          securityLabel={t.security}
        />
      </body>
    </html>
  );
}
