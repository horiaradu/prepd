"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGTMEvent } from "@next/third-parties/google";
import { normalizePath } from "@/lib/analytics";

export function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const normalized = normalizePath(pathname);
    const query = searchParams.toString();
    const pagePath = query ? `${normalized}?${query}` : normalized;
    sendGTMEvent({
      event: "page_view",
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
