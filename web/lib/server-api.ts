import { auth } from "@/lib/auth";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Build a base64-encoded x-user-id token for Express auth middleware.
 */
function buildXUserId(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Make an authenticated server-side request to the Express backend.
 * Automatically gets the userId from the NextAuth session.
 */
async function serverFetch<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  } = {}
): Promise<{ data: T | null; error: { code: string; message: string; details: unknown } | null; meta: Record<string, unknown> }> {
  const session = await auth();
  const userId = session?.user?.id;

  const { method = "GET", body, params } = options;

  // Build URL with query params
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};

  // Add x-user-id header for authentication
  if (userId) {
    headers["x-user-id"] = buildXUserId(userId);
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  return res.json();
}

// Server-side convenience methods
export const serverApi = {
  get: <T = unknown>(path: string, params?: Record<string, string | number | undefined>) =>
    serverFetch<T>(path, { params }),

  post: <T = unknown>(path: string, body?: unknown) =>
    serverFetch<T>(path, { method: "POST", body }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    serverFetch<T>(path, { method: "PATCH", body }),

  delete: <T = unknown>(path: string, params?: Record<string, string | number | undefined>) =>
    serverFetch<T>(path, { method: "DELETE", params }),
};
