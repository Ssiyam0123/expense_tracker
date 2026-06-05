import { auth } from "@/lib/auth";

/**
 * Extract the authenticated user's MongoDB ObjectId from the session.
 * Returns null if not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}
