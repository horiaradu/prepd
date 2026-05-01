import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .selectDistinctOn([recipeShares.recipientEmail], {
      email: recipeShares.recipientEmail,
    })
    .from(recipeShares)
    .where(eq(recipeShares.senderUserId, session.user.id))
    .orderBy(recipeShares.recipientEmail, desc(recipeShares.createdAt));

  return NextResponse.json(rows.map((r) => r.email));
}
