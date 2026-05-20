"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";
import { LanguageProvider } from "@/context/LanguageContext";
import { CookieConsentBanner } from "./CookieConsentBanner";
import type { Locale } from "@/lib/i18n";

export function Providers({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return (
    <SessionProvider>
      <LanguageProvider locale={locale}>
        <ServiceWorkerRegistrar />
        <CookieConsentBanner />
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}
