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
import { useSignUp } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
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

    if (!isLoaded) return;

    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password: password,
        firstName: name,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/" as any);
      } else {
        setError("Verification incomplete. Try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
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
            {!pendingVerification ? (
              <View className="gap-4">
                <View className="gap-2">
                  <Text className="text-zinc-300 text-sm font-medium">Name</Text>
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
                    placeholder="Your name"
                    placeholderTextColor="#71717a"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

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
            ) : (
              <View className="gap-4">
                <View className="gap-2">
                  <Text className="text-zinc-300 text-sm font-medium">Verification Code</Text>
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
                    placeholder="Enter verification code"
                    placeholderTextColor="#71717a"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
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
                  onPress={handleVerify}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Verify Email
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row justify-center gap-1">
              <Text style={{ color: "#a1a1aa", fontSize: 14 }}>Already have an account?</Text>
              <Link href="/(auth)/login" style={{ color: "#34d399", fontSize: 14, fontWeight: "500" }}>
                Sign In
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
