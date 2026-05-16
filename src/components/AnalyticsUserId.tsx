"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendGTMEvent } from "@next/third-parties/google";
import * as Sentry from "@sentry/nextjs";

export function AnalyticsUserId() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && userId) {
      sendGTMEvent({ event: "user_identified", user_id: userId });
      Sentry.setUser({ id: userId, email });
    } else {
      Sentry.setUser(null);
    }
  }, [status, userId, email]);

  return null;
}
