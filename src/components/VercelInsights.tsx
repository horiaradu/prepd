"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { normalizePath } from "@/lib/analytics";

function normalizedUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.pathname = normalizePath(url.pathname);
    return url.toString();
  } catch {
    return raw;
  }
}

export function VercelInsights() {
  return (
    <>
      <SpeedInsights
        beforeSend={(event) => ({
          ...event,
          url: normalizedUrl(event.url),
          route: event.route ? normalizePath(event.route) : event.route,
        })}
      />
      <Analytics
        beforeSend={(event) => ({
          ...event,
          url: normalizedUrl(event.url),
        })}
      />
    </>
  );
}
