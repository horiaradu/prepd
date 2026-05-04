"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ActivatePage() {
  const router = useRouter();
  const { update } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        await update();
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm w-full px-6">
        <div>
          <h1 className="flex items-center justify-center gap-3 text-2xl font-bold tracking-tight">
            <img
              src="/icons/icon-192.png"
              alt=""
              className="w-9 h-9 rounded-lg"
            />
            Welcome to Prepd
          </h1>
          <p className="text-gray-500 mt-2">
            Enter your invitation code to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invitation code"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center font-mono text-lg tracking-widest uppercase focus:outline-none focus:border-green-500 text-[16px]"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifying…" : "Activate"}
          </button>
        </form>
      </div>
    </div>
  );
}
