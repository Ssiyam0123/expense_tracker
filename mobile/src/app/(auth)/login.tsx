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
import { apiClient, getAuthBaseUrl, getApiBaseUrl } from "@/lib/api";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

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
      // Step 0: Try Direct JWT Auth (Express backend)
      let token: string | null = null;
      try {
        const directLoginRes = await apiClient.post(`${getAuthBaseUrl()}/login`, {
          email,
          password,
        });
        if (directLoginRes.data?.data?.token) {
          token = directLoginRes.data.data.token;
        }
      } catch (err) {
        // Fallback to NextAuth flow if direct login fails
      }

      if (token) {
        await signIn(token, serverUrl);
        router.replace("/" as any);
        return;
      }

      // Step 1: Get CSRF token from NextAuth
      const csrfRes = await apiClient.get(`${getAuthBaseUrl()}/csrf`);
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
        `${getAuthBaseUrl()}/callback/credentials`,
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
        const sessionRes = await apiClient.get(`${getAuthBaseUrl()}/session`);
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
          router.replace("/" as any);
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const scheme = Constants.expoConfig?.scheme || "mobile";
      const redirectUrl = `${scheme}://`;
      const backendRoot = getApiBaseUrl().replace("/api/v1", "");
      const authUrl = `${backendRoot}/api/auth/google`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === "success" && result.url) {
        // Parse redirect URL parameters
        const urlStr = result.url;
        const queryIndex = urlStr.indexOf("?");
        if (queryIndex !== -1) {
          const queryString = urlStr.slice(queryIndex + 1);
          const params = new URLSearchParams(queryString);
          const token = params.get("token");
          if (token) {
            await signIn(token, serverUrl);
            router.replace("/" as any);
            return;
          }
        }
      }
      setError("Google authentication was not completed.");
    } catch (err) {
      setError("Failed to sign in with Google.");
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
          <View className="absolute top-[-80] left-[-60] w-[220] h-[220] bg-emerald-500 rounded-full opacity-20" />
          <View className="absolute bottom-[-100] right-[-60] w-[250] h-[250] bg-emerald-600 rounded-full opacity-10" />

          <View className="gap-10">
            {/* Header */}
            <View className="gap-2 items-center">
              <Image
                source={require("../../../assets/images/logo.png")}
                style={{ width: 80, height: 80, marginBottom: 8, borderRadius: 16 }}
              />
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

              {/* Google Login Button */}
              <TouchableOpacity
                className="bg-zinc-900 border border-white/[0.08] rounded-xl py-4 items-center flex-row justify-center gap-2 mt-1"
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Text className="text-white text-base font-semibold">
                  🌐 Continue with Google
                </Text>
              </TouchableOpacity>
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
    </SafeAreaView>
  );
}
