"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslations, COOKIE_CONSENT_COOKIE } from "@/lib/i18n";

function buildTranslations(locale: "en" | "ro") {
  const t = getTranslations(locale);
  return {
    consentModal: {
      title: t.cookieConsentTitle,
      description: t.cookieConsentDescription,
      acceptAllBtn: t.cookieAcceptAll,
      acceptNecessaryBtn: t.cookieRejectAll,
      showPreferencesBtn: t.cookieManagePreferences,
    },
    preferencesModal: {
      title: t.cookiePreferencesTitle,
      acceptAllBtn: t.cookieAcceptAll,
      acceptNecessaryBtn: t.cookieRejectAll,
      savePreferencesBtn: t.cookieSavePreferences,
      closeIconLabel: t.cookieCloseLabel,
      sections: [
        {
          title: t.cookieNecessaryTitle,
          description: t.cookieNecessaryDescription,
          linkedCategory: "necessary",
        },
        {
          title: t.cookieAnalyticsTitle,
          description: t.cookieAnalyticsDescription,
          linkedCategory: "analytics",
        },
      ],
    },
  };
}

export function CookieConsentBanner() {
  const { locale } = useLanguage();

  useEffect(() => {
    CookieConsent.run({
      cookie: {
        name: COOKIE_CONSENT_COOKIE,
        expiresAfterDays: 182,
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          autoClear: {
            cookies: [{ name: /^_ga/ }, { name: /^_vercel/ }],
          },
        },
      },
      language: {
        default: locale,
        autoDetect: "document",
        translations: {
          en: buildTranslations("en"),
          ro: buildTranslations("ro"),
        },
      },
    });
  }, [locale]);

  return null;
}
