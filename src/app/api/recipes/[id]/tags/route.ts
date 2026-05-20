import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  COOK_STYLES,
  MEAL_TYPES,
  type CookStyle,
  type MealType,
} from "@/types/recipe";

type TagUpdate = {
  mealType?: MealType | null;
  cuisine?: string | null;
  cookStyle?: CookStyle | null;
  totalTimeMinutes?: number | null;
};

function normalizeCuisine(raw: unknown): string | null {
  if (raw === null) return null;
  if (typeof raw !== "string") return null;
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug.length > 0 ? slug : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: TagUpdate = {};

  if ("mealType" in body) {
    const v = body.mealType;
    if (v === null) {
      update.mealType = null;
    } else if (
      typeof v === "string" &&
      (MEAL_TYPES as readonly string[]).includes(v)
    ) {
      update.mealType = v as MealType;
    } else {
      return NextResponse.json({ error: "Invalid mealType" }, { status: 400 });
    }
  }

  if ("cookStyle" in body) {
    const v = body.cookStyle;
    if (v === null) {
      update.cookStyle = null;
    } else if (
      typeof v === "string" &&
      (COOK_STYLES as readonly string[]).includes(v)
    ) {
      update.cookStyle = v as CookStyle;
    } else {
      return NextResponse.json({ error: "Invalid cookStyle" }, { status: 400 });
    }
  }

  if ("cuisine" in body) {
    update.cuisine = normalizeCuisine(body.cuisine);
  }

  if ("totalTimeMinutes" in body) {
    const v = body.totalTimeMinutes;
    if (v === null) {
      update.totalTimeMinutes = null;
    } else if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      update.totalTimeMinutes = Math.round(v);
    } else {
      return NextResponse.json(
        { error: "Invalid totalTimeMinutes" },
        { status: 400 },
      );
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(recipes)
    .set({ ...update, updatedAt: new Date() })
    .where(and(eq(recipes.id, id), eq(recipes.userId, session.user.id)))
    .returning({
      mealType: recipes.mealType,
      cuisine: recipes.cuisine,
      cookStyle: recipes.cookStyle,
      totalTimeMinutes: recipes.totalTimeMinutes,
    });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
