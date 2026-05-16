"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendGTMEvent } from "@next/third-parties/google";

export function AnalyticsUserId() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    sendGTMEvent({ event: "user_identified", user_id: userId });
  }, [status, userId]);

  return null;
}
