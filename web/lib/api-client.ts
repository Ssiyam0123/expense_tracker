/**
 * Client-side API client for calling the Express backend.
 * Automatically reads the user ID from window.__USER_ID__ (set by dashboard layout).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T = unknown> {
  data: T | null;
  error: { code: string; message: string; details: unknown } | null;
  meta: Record<string, unknown>;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
}

declare global {
  interface Window {
    __USER_ID__?: string;
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

/**
 * Get the current user ID from window (set by server-rendered layout).
 */
function getUserId(): string | null {
  if (typeof window !== "undefined" && window.__USER_ID__) {
    return window.__USER_ID__;
  }
  return null;
}

export function getApiUserId(): string | null {
  return getUserId();
}

/**
 * Build a base64-encoded x-user-id token for Express auth middleware.
 */
function buildXUserId(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  return btoa(JSON.stringify(payload));
}

/**
 * Make an authenticated request to the Express backend.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, params } = options;

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

  const fetchHeaders: Record<string, string> = { ...headers };

  const userId = getUserId();
  if (userId) {
    fetchHeaders["x-user-id"] = buildXUserId(userId);
  }

  // Get Clerk session token if available on the client-side
  if (typeof window !== "undefined" && window.Clerk?.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        fetchHeaders["Authorization"] = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Failed to retrieve Clerk token:", err);
    }
  }

  if (body !== undefined) {
    fetchHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

export const api = {
  get: <T = unknown>(path: string, params?: Record<string, string | number | undefined>) =>
    apiFetch<T>(path, { params }),

  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),

  delete: <T = unknown>(path: string, params?: Record<string, string | number | undefined>) =>
    apiFetch<T>(path, { method: "DELETE", params }),
};

export const API_URL = API_BASE;
