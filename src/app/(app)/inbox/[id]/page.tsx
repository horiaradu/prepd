import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { recipeShares, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import SharedRecipeView from "@/components/SharedRecipeView";

export default async function SharedRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const { id } = await params;

  const [share] = await db
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
    .where(
      and(
        eq(recipeShares.id, id),
        eq(recipeShares.recipientEmail, session.user.email.toLowerCase()),
      ),
    );

  if (!share) {
    notFound();
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <SharedRecipeView
        shareId={share.id}
        senderName={share.senderName}
        senderEmail={share.senderEmail}
        recipe={share.recipeSnapshot}
        status={share.status}
        createdAt={share.createdAt.toISOString()}
      />
    </div>
  );
}
