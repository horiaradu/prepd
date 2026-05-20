export function Footer({
  privacyLabel,
  termsLabel,
  cookiesLabel,
}: {
  privacyLabel: string;
  termsLabel: string;
  cookiesLabel: string;
}) {
  return (
    <footer className="mt-auto border-t border-gray-100 py-4 text-center text-xs text-gray-400">
      <a href="/privacy" className="hover:text-gray-600">
        {privacyLabel}
      </a>
      <span className="mx-2">·</span>
      <a href="/terms" className="hover:text-gray-600">
        {termsLabel}
      </a>
      <span className="mx-2">·</span>
      <a href="/cookies" className="hover:text-gray-600">
        {cookiesLabel}
      </a>
    </footer>
  );
}
