import type { Metadata } from "next";
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
import { getTranslations, isValidLocale, LOCALE_COOKIE } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import "./globals.css";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Mintdish",
    template: "%s — Mintdish",
  },
  description:
    "Paste a recipe link, YouTube video, or photo — Mintdish pulls out ingredients, steps, and timing. No food blog fluff.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mintdish",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    siteName: "Mintdish",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value ?? "en";
  const locale: Locale = isValidLocale(raw) ? raw : "en";
  const t = getTranslations(locale);

  return (
    <html
      lang={locale}
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <head>
        <meta name="theme-color" content="#059669" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers locale={locale}>
          <AnalyticsUserId />
          <Suspense fallback={null}>
            <AnalyticsPageView />
          </Suspense>
          <AuthLayout>{children}</AuthLayout>
        </Providers>
        <Footer privacyLabel={t.privacy} termsLabel={t.terms} />
        <Suspense fallback={null}>
          <VercelInsights />
        </Suspense>
      </body>
    </html>
  );
}
