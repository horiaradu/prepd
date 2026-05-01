"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ServiceWorkerRegistrar />
      {children}
    </SessionProvider>
  );
}
