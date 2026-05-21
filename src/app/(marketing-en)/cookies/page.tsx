import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { ManageCookiePreferencesButton } from "@/components/ManageCookiePreferencesButton";

export const metadata: Metadata = {
  title: "Cookie Policy",
  alternates: {
    canonical: "/cookies",
    languages: { en: "/cookies", ro: "/cookies/ro" },
  },
};

export default function CookiePolicy() {
  return (
    <LegalDocument>
      <h1>Cookie Policy</h1>
      <p className="text-gray-500">Last updated: May 20, 2026</p>

      <p>
        Mintdish uses cookies to keep the app working and, with your consent, to
        understand how it is used.
      </p>

      <ManageCookiePreferencesButton label="Manage cookie preferences" />

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
    </LegalDocument>
  );
}
