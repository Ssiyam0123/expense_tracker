import { auth } from "@clerk/nextjs/server";

/**
 * Extract the authenticated user's Clerk user ID from the session.
 * Returns null if not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session.userId;
}
