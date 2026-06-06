import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "session_token";
const DEVICE_ID_KEY = "device_id";

let API_URL = "http://localhost:5000/api/v1";

export function setApiBaseUrl(url: string) {
  API_URL = url;
  apiClient.defaults.baseURL = url;
}

export function getApiBaseUrl(): string {
  return API_URL;
}

export function getAuthBaseUrl(): string {
  const base = API_URL.replace(/\/api\/v1\/?$/, "").replace(/\/v1\/?$/, "");
  return `${base}/api/auth`;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

// Attach auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could trigger a sign-out here
      clearSessionToken().catch(() => {});
    }
    return Promise.reject(error);
  }
);

// ─── Auth helpers ───────────────────────────────────────────────

export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  return token !== null;
}

// ─── Device ID ──────────────────────────────────────────────────

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === "web") {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function generateDeviceId(): string {
  const uuid = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
  return `mobile_${uuid.slice(0, 8)}`;
}

// ─── API wrapper functions ──────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string; details: unknown } | null;
  meta: Record<string, unknown>;
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<ApiResponse<T>> {
  const res = await apiClient.get<ApiResponse<T>>(endpoint, { params });
  return res.data;
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const res = await apiClient.post<ApiResponse<T>>(endpoint, body);
  return res.data;
}

export async function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const res = await apiClient.patch<ApiResponse<T>>(endpoint, body);
  return res.data;
}

export async function apiDelete<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<ApiResponse<T>> {
  const res = await apiClient.delete<ApiResponse<T>>(endpoint, { params });
  return res.data;
}
