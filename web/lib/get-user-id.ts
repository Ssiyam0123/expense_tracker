import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Extract the authenticated user's MongoDB ObjectId from the session or custom Bearer token.
 * Returns null if not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  // 1. Check for custom Mobile Bearer token first
  try {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // Try to parse the base64 JSON token
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (parsed.userId && parsed.exp && parsed.exp > Date.now()) {
        return parsed.userId;
      }
    }
  } catch (err) {
    // Fail silently and fall back to NextAuth
  }

  // 2. Fallback to standard NextAuth session
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}
