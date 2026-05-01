import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecipeSummaries } from "@/lib/recipes";
import RecipeList from "@/components/RecipeList";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const recipes = await getRecipeSummaries(session.user.id);

  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto">
      <RecipeList initialRecipes={recipes} />
    </div>
  );
}
