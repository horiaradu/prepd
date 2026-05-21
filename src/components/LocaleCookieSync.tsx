"use client";

import { useEffect } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export function LocaleCookieSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  return null;
}
