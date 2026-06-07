import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";

function TabIcon({
  focused,
  icon,
}: {
  focused: boolean;
  icon: string;
}) {
  return (
    <View className="items-center justify-center pt-2">
      <Text className="text-2xl" style={{ opacity: focused ? 1 : 0.6 }}>
        {icon}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 20 : 12,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 20,
          borderTopWidth: 0,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.08)",
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={60}
              tint="dark"
              className="absolute inset-0 rounded-[20px] overflow-hidden"
            />
          ) : (
            <View
              className="absolute inset-0 rounded-[20px]"
              style={{ backgroundColor: "rgba(9, 9, 11, 0.9)" }}
            />
          ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#71717a",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📊" />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💳" />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🎯" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" />
          ),
        }}
      />
    </Tabs>
  );
}
