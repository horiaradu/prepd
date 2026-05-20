"use client";

import * as CookieConsent from "vanilla-cookieconsent";

export default function CookiePolicy() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-4 text-sm text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_a]:text-green-700 [&_a]:underline">
      <h1>Cookie Policy</h1>
      <p className="text-gray-500">Last updated: May 20, 2026</p>

      <p>
        Mintdish uses cookies to keep the app working and, with your consent, to
        understand how it is used.
      </p>

      <button
        onClick={() => CookieConsent.showPreferences()}
        className="inline-flex items-center rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
      >
        Manage cookie preferences
      </button>

      <h2>Necessary</h2>
      <p>
        Cookies required for the app to function — keeping you signed in and
        remembering your language preference. These are always set and cannot be
        disabled.
      </p>

      <h2>Analytics</h2>
      <p>
        Cookies that help us understand how Mintdish is used, so we can improve
        it. These are only set if you accept analytics cookies. No personal data
        is sold or shared with third parties.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </div>
  );
}
