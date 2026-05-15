"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon, ChevronDownIcon, MailIcon } from "@/components/icons";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/context/LanguageContext";
import { LOCALES, type Locale } from "@/lib/i18n";

export function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t, locale, setLocale } = useLanguage();
  const {
    state: pushState,
    hasSubscription,
    subscribe,
  } = usePushNotifications();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const isSubpage = pathname !== "/" && pathname !== "/welcome";

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/inbox/count")
      .then((res) => res.json())
      .then((data) => setPendingCount(data.count ?? 0))
      .catch(() => {});
  }, [session?.user, pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSubpage && (
            <Link
              href="/"
              className="mr-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={t.backAriaLabel}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/icons/icon-nav.png"
              alt=""
              className="w-10 h-10"
            />
            <span className="text-lg font-bold tracking-tight">Mintdish</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle locale={locale} setLocale={setLocale} />

          {!session?.user && (
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors"
            >
              {t.signIn}
            </Link>
          )}

          {session?.user && (
            <>
              {session.user.email === "horia.radu23@gmail.com" && (
                <Link
                  href="/invitations"
                  className="text-gray-500 hover:text-gray-900 transition-colors p-1 text-xs font-medium"
                  aria-label={t.codesAriaLabel}
                >
                  Codes
                </Link>
              )}
              <Link
                href="/inbox"
                className="relative text-gray-500 hover:text-gray-900 transition-colors p-1"
                aria-label={t.inboxAriaLabel}
              >
                <MailIcon />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-full hover:bg-gray-50 p-1 pr-2 transition-colors"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-7 h-7 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                      {session.user.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className="text-xs text-gray-500 hidden sm:inline max-w-[220px] truncate">
                    {session.user.email}
                  </span>
                  <ChevronDownIcon
                    size={14}
                    className={`text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 truncate sm:hidden">
                      {session.user.email}
                    </div>
                    {pushState === "prompt" && (
                      <button
                        onClick={() => {
                          subscribe();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t.enableNotifications}
                      </button>
                    )}
                    {pushState === "denied" && (
                      <button
                        onClick={() => {
                          subscribe();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="block">{t.reEnableNotifications}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">
                          {t.notificationBlockedHint}
                        </span>
                      </button>
                    )}
                    {pushState === "granted" && !hasSubscription && (
                      <button
                        onClick={() => {
                          subscribe();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t.reEnableNotifications}
                      </button>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t.signOut}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function LanguageToggle({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 text-xs font-medium text-gray-400">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-gray-200">|</span>}
          <button
            onClick={() => setLocale(l)}
            className={`px-1 py-0.5 rounded transition-colors uppercase ${
              locale === l
                ? "text-green-600 font-semibold"
                : "hover:text-gray-600"
            }`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
