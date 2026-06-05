import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import {
  isAuthenticated,
  getSessionToken,
} from "@/lib/api";
import { startBackgroundSync, stopBackgroundSync } from "@/db/sync";

/**
 * Custom hook for managing authentication state.
 * Initializes auth on mount and manages background sync lifecycle.
 */
export function useAuth() {
  const {
    token,
    isLoading,
    isSignedIn,
    serverUrl,
    initialize,
    signIn,
    signOut,
    setServerUrl,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Manage background sync based on auth state
  useEffect(() => {
    if (isSignedIn) {
      startBackgroundSync();
    }
    return () => {
      stopBackgroundSync();
    };
  }, [isSignedIn]);

  return {
    token,
    isLoading,
    isSignedIn,
    serverUrl,
    signIn,
    signOut,
    setServerUrl,
  };
}

/**
 * Get the current auth token directly (for use outside components).
 */
export async function getAuthToken(): Promise<string | null> {
  return getSessionToken();
}

/**
 * Check if authenticated (for use outside components).
 */
export async function checkAuth(): Promise<boolean> {
  return isAuthenticated();
}
