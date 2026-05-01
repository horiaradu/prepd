import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ count: 0 });
  }

  const [result] = await db
    .select({ count: count() })
    .from(recipeShares)
    .where(
      and(
        eq(recipeShares.recipientEmail, session.user.email.toLowerCase()),
        eq(recipeShares.status, "pending"),
      ),
    );

  return NextResponse.json({ count: result.count });
}
