import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireActivation } from "@/lib/activation";
import { getRecipeSummaries } from "@/lib/recipes";
import RecipeList from "@/components/RecipeList";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  await requireActivation();

  const recipes = await getRecipeSummaries(session.user.id);

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <RecipeList initialRecipes={recipes} />
    </div>
  );
}
