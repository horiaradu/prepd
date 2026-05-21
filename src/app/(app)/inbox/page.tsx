import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import InboxList from "@/components/InboxList";

export default async function InboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const shares = await db
    .select({
      id: recipeShares.id,
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

  const items = shares.map((s) => ({
    id: s.id,
    senderName: s.senderName,
    senderEmail: s.senderEmail,
    title: s.recipeSnapshot.title,
    servings: s.recipeSnapshot.servings,
    ingredientCount: s.recipeSnapshot.ingredients.length,
    imageUrl: s.recipeSnapshot.images?.[0]?.blobUrl
      ? `/api/inbox/${s.id}/image`
      : (s.recipeSnapshot.images?.[0]?.url ?? null),
    sourceType: s.recipeSnapshot.sourceType,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <InboxList initialItems={items} />
    </div>
  );
}
