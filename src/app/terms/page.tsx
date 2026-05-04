export default function TermsOfService() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-4 text-sm text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-green-700 [&_a]:underline">
      <h1>Terms of Service</h1>
      <p className="text-gray-500">Last updated: May 4, 2026</p>

      <h2>Acceptance</h2>
      <p>
        By using Prepd, you agree to these terms. If you don&apos;t agree,
        please don&apos;t use the service.
      </p>

      <h2>The service</h2>
      <p>
        Prepd is a personal recipe organizer. We provide it as-is, without
        guarantees of availability or data preservation. We do our best to keep
        your data safe, but you should keep backups of anything important.
      </p>

      <h2>Your content</h2>
      <p>
        You own the recipes and data you store in Prepd. We don&apos;t claim any
        rights to your content. We may process your content through third-party
        AI services (OpenAI) to provide features like recipe parsing and chat.
      </p>

      <h2>Acceptable use</h2>
      <p>Don&apos;t use Prepd to:</p>
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
        <a href="mailto:horia@prepd.app">horia@prepd.app</a>.
      </p>

      <h2>Liability</h2>
      <p>
        Prepd is provided &ldquo;as is&rdquo; without warranty. We are not
        liable for any damages arising from your use of the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes constitutes
        acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:horia@prepd.app">horia@prepd.app</a>.
      </p>
    </div>
  );
}
