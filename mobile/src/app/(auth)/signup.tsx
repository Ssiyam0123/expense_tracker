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
import { apiClient, getAuthBaseUrl } from "@/lib/api";

function formUrlEncode(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function toBase64(str: string): string {
  if (typeof btoa !== "undefined") return btoa(str);
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

export default function SignupScreen() {
  const router = useRouter();
  const { signIn, serverUrl } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Signup via the API v1 signup route (JSON)
      const signupRes = await apiClient.post("/signup", { name, email, password });

      if (signupRes.data?.error) {
        setError(signupRes.data.error.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      // Signup succeeded, now log in automatically
      // First get CSRF token
      const csrfRes = await apiClient.get(`${getAuthBaseUrl()}/csrf`);
      const csrfToken = csrfRes.data?.csrfToken;

      if (!csrfToken) {
        setError("Account created but could not sign in automatically.");
        setIsLoading(false);
        return;
      }

      const loginBody = formUrlEncode({
        email,
        password,
        csrfToken,
        callbackUrl: "/dashboard",
        json: "true",
      });

      await apiClient.post(`${getAuthBaseUrl()}/callback/credentials`, loginBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Get session
      const sessionRes = await apiClient.get(`${getAuthBaseUrl()}/session`);
      if (sessionRes.data?.user?.id) {
        const mobileToken = toBase64(
          JSON.stringify({
            userId: sessionRes.data.user.id,
            email: sessionRes.data.user.email,
            exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
          })
        );
        await signIn(mobileToken, serverUrl);
        router.replace("/index" as any);
        return;
      }

      setError("Account created but could not sign in. Please try logging in.");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Signup failed. Please try again."
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
        <View className="absolute top-[-60] right-[-40] w-[200] h-[200] bg-emerald-500 rounded-full opacity-15" />
        <View className="absolute bottom-[-120] left-[-80] w-[300] h-[300] bg-emerald-600 rounded-full opacity-8" />

        <View className="gap-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-white text-3xl font-bold text-center">
              Create Account
            </Text>
            <Text className="text-zinc-400 text-sm text-center">
              Start tracking your expenses today
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-zinc-300 text-sm font-medium">Name</Text>
              <TextInput
                className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-base"
                placeholder="Your name"
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

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
              <Text className="text-zinc-600 text-xs">
                Min 8 characters with uppercase, lowercase & number
              </Text>
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
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-zinc-500 text-sm">Already have an account?</Text>
            <Link href="/(auth)/login" className="text-emerald-400 text-sm font-medium">
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
