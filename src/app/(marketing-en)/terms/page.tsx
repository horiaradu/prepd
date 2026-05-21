import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: {
    canonical: "/terms",
    languages: { en: "/terms", ro: "/terms/ro" },
  },
};

export default function TermsOfService() {
  return (
    <LegalDocument>
      <h1>Terms of Service</h1>
      <p className="text-gray-500">Last updated: May 4, 2026</p>

      <h2>Acceptance</h2>
      <p>
        By using Mintdish, you agree to these terms. If you don&apos;t agree,
        please don&apos;t use the service.
      </p>

      <h2>The service</h2>
      <p>
        Mintdish is a personal recipe organizer. We provide it as-is, without
        guarantees of availability or data preservation. We do our best to keep
        your data safe, but you should keep backups of anything important.
      </p>

      <h2>Your content</h2>
      <p>
        You own the recipes and data you store in Mintdish. We don&apos;t claim
        any rights to your content. We may process your content through
        third-party AI services (Google Gemini) to provide features like recipe
        parsing and chat.
      </p>

      <h2>Acceptable use</h2>
      <p>Don&apos;t use Mintdish to:</p>
      <ul>
        <li>Store or share illegal content</li>
        <li>Spam other users with unwanted shares</li>
        <li>Attempt to access other users&apos; data</li>
        <li>Abuse the service in ways that degrade it for others</li>
      </ul>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these terms. You can
        delete your account at any time by contacting{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>

      <h2>Liability</h2>
      <p>
        Mintdish is provided &ldquo;as is&rdquo; without warranty. We are not
        liable for any damages arising from your use of the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes constitutes
        acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </LegalDocument>
  );
}
