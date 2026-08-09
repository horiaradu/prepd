import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema";

// Every parse spends Gemini tokens and possibly ScraperAPI credits, so cap
// how many recipes a user can create per hour. DB-backed — no extra
// infrastructure, and serverless-safe.
const MAX_PARSES_PER_HOUR = 20;

export async function parseAllowance(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ recent: count(recipes.id) })
    .from(recipes)
    .where(
      and(eq(recipes.userId, userId), gt(recipes.createdAt, oneHourAgo)),
    );
  return Number(row.recent) < MAX_PARSES_PER_HOUR;
}
