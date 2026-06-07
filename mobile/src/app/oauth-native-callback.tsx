import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function OAuthNativeCallback() {
  const router = useRouter();

  useEffect(() => {
    // Let Clerk active session update, then redirect to root index
    const timer = setTimeout(() => {
      router.replace("/" as any);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}
