import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { apiClient } from "@/lib/api";

/**
 * Build a form-urlencoded body string from an object.
 */
function formUrlEncode(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Base64 encode a string (React Native compatible — btoa is not available in RN).
 */
function toBase64(str: string): string {
  // Use a method that works in React Native (btoa doesn't exist)
  if (typeof btoa !== "undefined") return btoa(str);
  // Fallback for environments without btoa
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let result = "";
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = str.charCodeAt(i + 1);
    const c = str.charCodeAt(i + 2);
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | ((b >> 4) & 15)];
    result += chars[((b & 15) << 2) | ((c >> 6) & 3)];
    result += chars[c & 63];
  }
  return result.replace(/=+$/, "");
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setServerUrl, serverUrl } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get CSRF token from NextAuth
      const csrfRes = await apiClient.get("/../api/auth/csrf");
      const csrfToken = csrfRes.data?.csrfToken;

      if (!csrfToken) {
        setError("Unable to connect to server. Check your server URL.");
        setIsLoading(false);
        return;
      }

      // Step 2: POST credentials to NextAuth callback
      const body = formUrlEncode({
        email,
        password,
        csrfToken,
        callbackUrl: "/dashboard",
        json: "true",
      });

      const signInRes = await apiClient.post(
        "/../api/auth/callback/credentials",
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // NextAuth returns a redirect on success
      if (signInRes.data?.url) {
        // Get session token from the session endpoint
        const sessionRes = await apiClient.get("/../api/auth/session");
        if (sessionRes.data?.user?.id) {
          // Store a simple token derived from the user ID for Bearer auth
          // In production, the server should issue a dedicated JWT for mobile
          const mobileToken = toBase64(
            JSON.stringify({
              userId: sessionRes.data.user.id,
              email: sessionRes.data.user.email,
              exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            })
          );
          await signIn(mobileToken, serverUrl);
          router.replace("/index");
          return;
        }
      }

      setError("Invalid email or password");
    } catch (err: unknown) {
      setError(
        "Unable to connect to server. Please verify the server URL and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        className="flex-1 bg-black"
      >
        {/* Neon background blobs */}
        <View className="absolute top-[-80] left-[-60] w-[220] h-[220] bg-emerald-500 rounded-full opacity-20" />
        <View className="absolute bottom-[-100] right-[-60] w-[250] h-[250] bg-emerald-600 rounded-full opacity-10" />

        <View className="gap-10">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-white text-4xl font-bold text-center">
              Expense Tracker
            </Text>
            <Text className="text-zinc-400 text-base text-center">
              Track every taka, effortlessly
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-zinc-300 text-sm font-medium">Email</Text>
              <TextInput
                className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-base"
                placeholder="you@example.com"
                placeholderTextColor="#71717a"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View className="gap-2">
              <Text className="text-zinc-300 text-sm font-medium">Password</Text>
              <TextInput
                className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-base"
                placeholder="••••••••"
                placeholderTextColor="#71717a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error && (
              <View className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}

            <TouchableOpacity
              className={`bg-emerald-500 rounded-xl py-4 items-center mt-2 ${
                isLoading ? "opacity-70" : ""
              }`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Server URL config */}
          <View className="gap-2">
            <Text className="text-zinc-500 text-xs text-center">
              Server URL
            </Text>
            <TextInput
              className="bg-white/[0.04] border border-white/[0.05] rounded-lg px-3 py-2 text-zinc-400 text-xs text-center"
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://localhost:3000/api/v1"
              placeholderTextColor="#52525b"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Signup link */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-zinc-500 text-sm">Don't have an account?</Text>
            <Link href="/(auth)/signup" className="text-emerald-400 text-sm font-medium">
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
