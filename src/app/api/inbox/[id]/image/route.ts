import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [share] = await db
    .select({ recipeSnapshot: recipeShares.recipeSnapshot })
    .from(recipeShares)
    .where(
      and(
        eq(recipeShares.id, id),
        eq(recipeShares.recipientEmail, session.user.email.toLowerCase()),
      ),
    );

  const blobUrl = share?.recipeSnapshot?.images?.[0]?.blobUrl;
  if (!blobUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await get(blobUrl, { access: "private" });
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
