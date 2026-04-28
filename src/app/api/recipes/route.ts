import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      sourceUrl: recipes.sourceUrl,
      sourceType: recipes.sourceType,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(eq(recipes.userId, session.user.id))
    .orderBy(desc(recipes.createdAt));

  return NextResponse.json(rows);
}
