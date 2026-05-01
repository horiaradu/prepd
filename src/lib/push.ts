import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

webpush.setVapidDetails(
  "mailto:horia@prepd.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const PUSH_MESSAGE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function sendPushToUser(
  recipientEmail: string,
  payload: { title: string; body: string; url?: string },
) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, recipientEmail));

  if (!user) return;

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, user.id));

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
        { TTL: PUSH_MESSAGE_TTL_SECONDS },
      );
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        (err as { statusCode: number }).statusCode === 410
      ) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, sub.endpoint));
      }
    }
  });

  await Promise.allSettled(promises);
}
