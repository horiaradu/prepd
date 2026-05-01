"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GoogleIcon } from "@/components/icons";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold tracking-tight">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-10 h-10 rounded-lg"
          />
          Prepd
        </h1>
        <p className="text-gray-500">Sign in to access your recipes</p>

        {error === "AccessDenied" && (
          <p className="text-red-500 text-sm">
            Access denied. Only authorized accounts can sign in.
          </p>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:border-green-600 transition-colors flex items-center gap-3 mx-auto"
        >
          <GoogleIcon className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
