import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import * as RN from "react-native";
const NativeInput = RN.TextInput;
import { Link, useRouter } from "expo-router";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/" as any);
      } else {
        setError("Sign in incomplete. Additional steps required.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow();
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace("/" as any);
      } else {
        setError("Google authentication was not completed.");
      }
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
                <NativeInput
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: "#ffffff",
                    fontSize: 16,
                  }}
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
                <View className="relative justify-center">
                  <NativeInput
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 12,
                      paddingLeft: 16,
                      paddingRight: 48,
                      paddingVertical: 14,
                      color: "#ffffff",
                      fontSize: 16,
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#71717a"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 p-1"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg">{showPassword ? "👁️" : "🙈"}</Text>
                  </TouchableOpacity>
                </View>
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
