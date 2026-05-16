"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";
import { send, trackLogin } from "@/lib/analytics-events";

const LOGIN_FIRED_KEY = "mintdish:login_fired_for";

export function AnalyticsUserId() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && userId) {
      send({ event: "user_identified", user_id: userId });
      Sentry.setUser({ id: userId, email });
      if (sessionStorage.getItem(LOGIN_FIRED_KEY) !== userId) {
        trackLogin();
        sessionStorage.setItem(LOGIN_FIRED_KEY, userId);
      }
    } else {
      Sentry.setUser(null);
    }
  }, [status, userId, email]);

  return null;
}
