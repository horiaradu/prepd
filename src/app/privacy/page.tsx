export default function PrivacyPolicy() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-4 text-sm text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-green-700 [&_a]:underline">
      <h1>Privacy Policy</h1>
      <p className="text-gray-500">Last updated: May 20, 2026</p>

      <h2>What we collect</h2>
      <p>
        When you sign in with Google, we store your name, email address, and
        profile picture. We use this information solely to identify your account
        and personalize your experience.
      </p>

      <h2>Recipe data</h2>
      <p>
        Recipes you save, cook logs, chat messages, and images are stored in our
        database and associated with your account. Shared recipes include a
        snapshot of the recipe content sent to the recipient&apos;s email
        address.
      </p>

      <h2>Push notifications</h2>
      <p>
        If you enable push notifications, we store your browser&apos;s push
        subscription endpoint. You can disable notifications at any time through
        your browser settings.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>Google OAuth</strong> — authentication only; we do not access
          your Google data beyond basic profile info.
        </li>
        <li>
          <strong>Google Gemini</strong> — recipe parsing and generation. Recipe
          content (URLs, text, images) may be sent to Google&apos;s Gemini API
          for processing.
        </li>
        <li>
          <strong>Google Tag Manager / Google Analytics</strong> — event
          tracking and usage analytics, only when you have accepted analytics
          cookies.
        </li>
        <li>
          <strong>Vercel Analytics &amp; Speed Insights</strong> — anonymous
          web analytics and performance monitoring, only when you have accepted
          analytics cookies.
        </li>
        <li>
          <strong>Sentry</strong> — error tracking and performance monitoring.
          Your user ID and email address may be included in error reports to
          help diagnose issues.
        </li>
        <li>
          <strong>MailerLite</strong> — if you join our waitlist, your email
          address is stored in MailerLite and used to contact you about
          Mintdish.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and image storage.
        </li>
        <li>
          <strong>Neon</strong> — database hosting.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        Your data is retained as long as your account exists. To delete your
        account and all associated data, contact us at{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        We use two categories of cookies. See our{" "}
        <a href="/cookies">Cookie Policy</a> for the full list.
      </p>
      <ul>
        <li>
          <strong>Necessary</strong> — a session cookie for authentication and
          a cookie to remember your language preference. These are always set.
        </li>
        <li>
          <strong>Analytics</strong> — cookies set by Google Analytics and
          Vercel Analytics to measure usage. These are only set if you accept
          analytics cookies.
        </li>
      </ul>
      <p>
        You can change your cookie preferences at any time on the{" "}
        <a href="/cookies">Cookie Policy</a> page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </div>
  );
}
