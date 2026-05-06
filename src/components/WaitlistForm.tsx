"use client";

import Link from "next/link";
import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <>
      {submitted ? (
        <div className="bg-white/10 border border-white/20 rounded-lg px-6 py-5 text-green-50">
          Thanks — we&apos;ll be in touch.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-black transition-colors"
          >
            Request invite
          </button>
        </form>
      )}
      <div className="pt-2">
        <Link
          href="/login"
          className="text-sm text-green-50/80 hover:text-white underline underline-offset-4"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </>
  );
}
