"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function WaitlistForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError(t.waitlistError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {submitted ? (
        <div className="bg-white/10 border border-white/20 rounded-lg px-6 py-5 text-green-50">
          {t.thankYou}
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-black transition-colors disabled:opacity-60"
            >
              {loading ? t.sending : t.requestInvite}
            </button>
          </form>
          {error && (
            <p className="text-sm text-red-300 pt-1">{error}</p>
          )}
        </>
      )}
      <div className="pt-2">
        <Link
          href="/login"
          className="text-sm text-green-50/80 hover:text-white underline underline-offset-4"
        >
          {t.alreadyHaveAccount}
        </Link>
      </div>
    </>
  );
}
