import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/Providers";
import { AppHeader } from "@/components/AppHeader";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { Footer } from "@/components/Footer";
import { LocaleCookieSync } from "@/components/LocaleCookieSync";
import { getTranslations } from "@/lib/i18n";
import "../globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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

export default function MarketingRoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = getTranslations("ro");

  return (
    <html lang="ro" className={`${jakartaSans.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#059669" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers locale="ro">
          <LocaleCookieSync locale="ro" />
          <Suspense fallback={null}>
            <AnalyticsPageView />
          </Suspense>
          <AppHeader />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
        <Footer
          locale="ro"
          faqLabel={t.faq}
          privacyLabel={t.privacy}
          termsLabel={t.terms}
          cookiesLabel={t.cookies}
        />
      </body>
    </html>
  );
}
