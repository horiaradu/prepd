import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecipe, getRecipeMessages } from "@/lib/recipes";
import RecipeDetails from "@/components/RecipeDetails";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const [recipe, messages] = await Promise.all([
    getRecipe(id, session.user.id),
    getRecipeMessages(id),
  ]);

  if (!recipe) {
    notFound();
  }

  return <RecipeDetails initialRecipe={recipe} initialMessages={messages} />;
}
