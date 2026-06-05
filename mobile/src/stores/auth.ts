import { create } from "zustand";
import {
  isAuthenticated,
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  setApiBaseUrl,
} from "@/lib/api";

interface AuthState {
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  serverUrl: string;

  initialize: () => Promise<void>;
  signIn: (token: string, serverUrl: string) => Promise<void>;
  signOut: () => Promise<void>;
  setServerUrl: (url: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  isSignedIn: false,
  serverUrl: "http://localhost:3000/api/v1",

  initialize: async () => {
    try {
      const authenticated = await isAuthenticated();
      const token = authenticated ? await getSessionToken() : null;
      set({
        token,
        isSignedIn: authenticated,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  signIn: async (token: string, serverUrl: string) => {
    await setSessionToken(token);
    setApiBaseUrl(serverUrl);
    set({
      token,
      isSignedIn: true,
      serverUrl,
    });
  },

  signOut: async () => {
    await clearSessionToken();
    set({
      token: null,
      isSignedIn: false,
    });
  },

  setServerUrl: (url: string) => {
    setApiBaseUrl(url);
    set({ serverUrl: url });
  },
}));
