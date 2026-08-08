import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { invitationCodes } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const codes = await db
    .select()
    .from(invitationCodes)
    .orderBy(invitationCodes.createdAt);

  return NextResponse.json(codes);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const code = randomBytes(4).toString("hex").toUpperCase();

  const [created] = await db
    .insert(invitationCodes)
    .values({ code })
    .returning();

  return NextResponse.json(created);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const ids: string[] = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  await db.delete(invitationCodes).where(inArray(invitationCodes.id, ids));

  return NextResponse.json({ ok: true });
}
