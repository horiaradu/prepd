import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes, cookLog } from "@/db/schema";
import { eq, desc, count, max } from "drizzle-orm";

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
      images: recipes.images,
      cookCount: count(cookLog.id),
      lastCookedAt: max(cookLog.cookedAt),
    })
    .from(recipes)
    .leftJoin(cookLog, eq(recipes.id, cookLog.recipeId))
    .where(eq(recipes.userId, session.user.id))
    .groupBy(recipes.id)
    .orderBy(desc(max(cookLog.cookedAt)), desc(recipes.createdAt));

  const result = rows.map((row) => ({
    ...row,
    imageUrl: row.images?.[0]?.url ?? null,
    images: undefined,
  }));

  return NextResponse.json(result);
}
