import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useToastStore } from "@/stores/toast";
import { Text, TouchableOpacity } from "react-native";
import "../global.css";

function ToastContainer() {
  const { message, type, hideToast } = useToastStore();
  if (!message) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 90,
        left: 20,
        right: 20,
        backgroundColor: type === "success" ? "rgba(16, 185, 129, 0.9)" : type === "error" ? "rgba(239, 68, 68, 0.9)" : "rgba(39, 39, 42, 0.9)",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 9999,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={hideToast} style={{ paddingLeft: 10 }}>
        <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 14, fontWeight: "bold" }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/" as any);
    }
  }, [isSignedIn, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <AuthGuard>
        <Slot />
      </AuthGuard>
      <ToastContainer />
    </>
  );
}
