import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getActivatedSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!session.user.activated) return null;
  return session;
}
