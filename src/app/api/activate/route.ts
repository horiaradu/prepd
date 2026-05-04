import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { invitationCodes } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code =
    typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const [invitation] = await db
    .select()
    .from(invitationCodes)
    .where(
      and(eq(invitationCodes.code, code), isNull(invitationCodes.usedByUserId)),
    );

  if (!invitation) {
    return NextResponse.json(
      { error: "Invalid or already used code" },
      { status: 400 },
    );
  }

  await db
    .update(invitationCodes)
    .set({ usedByUserId: session.user.id, usedAt: new Date() })
    .where(eq(invitationCodes.id, invitation.id));

  return NextResponse.json({ ok: true });
}
