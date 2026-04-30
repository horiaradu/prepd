import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select({ sourceUrl: recipes.sourceUrl, sourceType: recipes.sourceType })
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id)));

  if (!row || row.sourceType !== "image" || !row.sourceUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await get(row.sourceUrl, { access: "private" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
