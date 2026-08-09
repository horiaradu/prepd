"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output.buffer as ArrayBuffer;
}

type PushState = "unsupported" | "prompt" | "granted" | "denied";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("unsupported");
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }
    const perm = Notification.permission;
    setState(perm === "default" ? "prompt" : perm);

    if (perm === "granted") {
      let mounted = true;
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (!mounted) return;
          setHasSubscription(sub !== null);
          // Re-post the live subscription so the server refreshes lastSeenAt.
          // Keeps active devices marked fresh; stale ones (uninstalled) stop
          // reporting and can be pruned.
          if (sub) {
            fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sub.toJSON()),
            }).catch(() => {});
          }
        })
        .catch(() => { if (mounted) setHasSubscription(false); });
      return () => { mounted = false; };
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      setState(permission as PushState);

      if (permission !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) {
        // Server rejected the subscription — don't claim success, or the UI
        // hides the enable button for a subscription that was never stored.
        throw new Error(`subscribe failed: ${res.status}`);
      }
      setHasSubscription(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
      setHasSubscription(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setHasSubscription(false);
      setState("prompt");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, []);

  return { state, hasSubscription, subscribe, unsubscribe };
}
