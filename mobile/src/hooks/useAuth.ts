import { useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { setSessionToken, clearSessionToken } from "@/lib/api";

/**
 * Custom hook for managing authentication state via Clerk.
 * Syncs the active Clerk JWT token to the Axios api client on mount/changes.
 */
export function useAuth() {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuth();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    async function syncToken() {
      if (isLoaded) {
        if (isSignedIn) {
          try {
            const token = await getToken();
            if (token) {
              await setSessionToken(token);
            }
            setIsSynced(true);
          } catch (e) {
            setIsSynced(true);
          }
        } else {
          await clearSessionToken();
          setIsSynced(true);
        }
      }
    }
    setIsSynced(false);
    syncToken();
  }, [isSignedIn, isLoaded, getToken]);

  return {
    token: null,
    isLoading: !isLoaded || (!!isSignedIn && !isSynced),
    isSignedIn: !!isSignedIn,
    serverUrl: "http://localhost:5000/api/v1", // Default dev backend
    signIn: async () => {}, // Handled directly in screen components via Clerk hooks
    signOut: async () => {
      await signOut();
      await clearSessionToken();
    },
    setServerUrl: () => {},
  };
}

export async function getAuthToken(): Promise<string | null> {
  return null; // Token is managed internally by Clerk
}

export async function checkAuth(): Promise<boolean> {
  return false;
}
