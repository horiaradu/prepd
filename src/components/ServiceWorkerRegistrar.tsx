"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async () => {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (!sub) return;
          const res = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          });
          if (!res.ok) {
            console.error("Push subscription sync failed:", res.status);
          }
        } catch (err) {
          console.error("Push subscription sync failed:", err);
        }
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });
  }, []);

  return null;
}
