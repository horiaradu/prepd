import type { ReactNode } from "react";

export function LegalDocument({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-4 text-sm text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-green-700 [&_a]:underline">
      {children}
    </div>
  );
}
