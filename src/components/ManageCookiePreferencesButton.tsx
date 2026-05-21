"use client";

import * as CookieConsent from "vanilla-cookieconsent";

export function ManageCookiePreferencesButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => CookieConsent.showPreferences()}
      className="inline-flex items-center rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
    >
      {label}
    </button>
  );
}
