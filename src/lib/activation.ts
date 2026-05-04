import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireActivation() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  if (!session.user.activated) {
    redirect("/activate");
  }
}
