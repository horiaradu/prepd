"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GoogleIcon } from "@/components/icons";
import { useLanguage } from "@/context/LanguageContext";

function LoginContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold tracking-tight">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-10 h-10 rounded-lg"
          />
          Mintdish
        </h1>
        <p className="text-gray-500">{t.signInToAccess}</p>

        {error === "AccessDenied" && (
          <p className="text-red-500 text-sm">{t.accessDenied}</p>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:border-green-600 transition-colors flex items-center gap-3 mx-auto"
        >
          <GoogleIcon className="w-5 h-5" />
          {t.signInWithGoogle}
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
