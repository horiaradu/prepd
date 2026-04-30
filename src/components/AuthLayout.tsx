"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
