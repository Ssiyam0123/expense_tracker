import { auth } from "@clerk/nextjs/server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Make an authenticated server-side request to the Express backend.
 * Automatically gets the JWT token from the Clerk session.
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
  const token = await session.getToken();

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

  // Add Clerk Bearer token for authentication
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
