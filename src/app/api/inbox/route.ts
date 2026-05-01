import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shares = await db
    .select({
      id: recipeShares.id,
      senderUserId: recipeShares.senderUserId,
      senderName: users.name,
      senderEmail: users.email,
      recipeSnapshot: recipeShares.recipeSnapshot,
      status: recipeShares.status,
      createdAt: recipeShares.createdAt,
    })
    .from(recipeShares)
    .leftJoin(users, eq(recipeShares.senderUserId, users.id))
    .where(eq(recipeShares.recipientEmail, session.user.email.toLowerCase()))
    .orderBy(desc(recipeShares.createdAt));

  return NextResponse.json(shares);
}
