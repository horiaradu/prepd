import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { GoogleTagManager } from "@next/third-parties/google";
import { Suspense } from "react";
import { Providers } from "@/components/Providers";
import { AuthLayout } from "@/components/AuthLayout";
import { AnalyticsUserId } from "@/components/AnalyticsUserId";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { VercelInsights } from "@/components/VercelInsights";
import { Footer } from "@/components/Footer";
import {
  getTranslations,
  isValidLocale,
  LOCALE_COOKIE,
  COOKIE_CONSENT_COOKIE,
} from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { siteMetadata, siteViewport } from "@/lib/site-metadata";
import "../globals.css";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
});

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value ?? "en";
  const locale: Locale = isValidLocale(raw) ? raw : "en";
  const t = getTranslations(locale);

  const consentRaw = cookieStore.get(COOKIE_CONSENT_COOKIE)?.value;
  let analyticsConsented = false;
  try {
    if (consentRaw) {
      const consent = JSON.parse(consentRaw) as { categories?: string[] };
      analyticsConsented = consent.categories?.includes("analytics") ?? false;
    }
  } catch {
    // malformed cookie — treat as no consent
  }

  return (
    <html
      lang={locale}
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      {gtmId && analyticsConsented && <GoogleTagManager gtmId={gtmId} />}
      <body className="min-h-full flex flex-col">
        <Providers locale={locale}>
          <AnalyticsUserId />
          <Suspense fallback={null}>
            <AnalyticsPageView />
          </Suspense>
          <AuthLayout>{children}</AuthLayout>
        </Providers>
        <Footer
          locale={locale}
          faqLabel={t.faq}
          privacyLabel={t.privacy}
          termsLabel={t.terms}
          cookiesLabel={t.cookies}
        />
        {analyticsConsented && (
          <Suspense fallback={null}>
            <VercelInsights />
          </Suspense>
        )}
      </body>
    </html>
  );
}
