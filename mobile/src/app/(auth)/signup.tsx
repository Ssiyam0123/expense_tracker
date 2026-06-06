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
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { apiClient, getAuthBaseUrl } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

function formUrlEncode(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function toBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    const byte2 = i < bytes.length ? bytes[i++] : NaN;
    const byte3 = i < bytes.length ? bytes[i++] : NaN;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
    const enc3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
    const enc4 = isNaN(byte3) ? 64 : byte3 & 63;

    result += chars.charAt(enc1) + chars.charAt(enc2) + (enc3 === 64 ? "=" : chars.charAt(enc3)) + (enc4 === 64 ? "=" : chars.charAt(enc4));
  }
  return result;
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      let signupData = null;

      // Step 0: Try Direct Express Sign Up
      try {
        const directSignupRes = await apiClient.post(`${getAuthBaseUrl()}/signup`, {
          name,
          email,
          password,
        });
        if (directSignupRes.data?.data) {
          signupData = directSignupRes.data.data;
        }
      } catch (err) {
        // Fallback to Next.js API
      }

      if (signupData && signupData.token) {
        // Direct auto-login for Express
        await signIn(signupData.token, serverUrl);
        router.replace("/" as any);
        return;
      }

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
        router.replace("/" as any);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right", "bottom"]}>
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
            <View className="gap-2 items-center">
              <Image
                source={require("../../../assets/images/logo.png")}
                style={{ width: 80, height: 80, marginBottom: 8, borderRadius: 16 }}
              />
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
                  Min 6 characters
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
    </SafeAreaView>
  );
}
