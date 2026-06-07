import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore } from "@/stores/transactions";
import { useBudgetStore } from "@/stores/budgets";
import { useCategoryStore } from "@/stores/categories";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut, isLoading: isAuthLoading } = useAuth();
  
  const { transactions, fetchTransactions, isLoading: isTxLoading } = useTransactionStore();
  const { budgets, fetchBudgets, isLoading: isBudgetsLoading } = useBudgetStore();
  const { categories, fetchCategories, isLoading: isCatsLoading } = useCategoryStore();

  const isLoading = isTxLoading || isBudgetsLoading || isCatsLoading || !isUserLoaded;

  const handleRefresh = () => {
    fetchTransactions({ limit: "100" });
    fetchBudgets();
    fetchCategories();
  };

  useEffect(() => {
    fetchTransactions({ limit: "100" });
    fetchBudgets();
    fetchCategories();
  }, []);

  const totalTxCount = Array.isArray(transactions) ? transactions.length : 0;
  const totalBudgetsCount = Array.isArray(budgets) ? budgets.length : 0;
  const totalCategoriesCount = Array.isArray(categories) ? categories.length : 0;

  const userEmail = user?.primaryEmailAddress?.emailAddress || "user@example.com";
  const userFullName = user?.fullName || user?.firstName || "Expense Tracker User";
  const userImageUrl = user?.imageUrl;
  
  // Format joined date
  const joinedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : "Recently";

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Background ambient light blobs */}
      <View className="absolute top-[-50] left-[-50] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[80px]" />
      <View className="absolute bottom-[100] right-[-60] w-[220px] h-[220px] bg-emerald-600/5 rounded-full blur-[90px]" />

      <ScrollView
        className="flex-1 px-4 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#10B981"
          />
        }
        contentContainerClassName="pb-28"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Account</Text>
          <Text className="text-white text-2xl font-bold tracking-tight">Profile</Text>
        </View>

        {/* User Card */}
        <View className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 mb-6 items-center">
          <View className="absolute top-0 left-0 h-[2px] w-full bg-emerald-500/30" />
          
          {userImageUrl ? (
            <Image
              source={{ uri: userImageUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
              className="border-2 border-emerald-500/50 mb-3"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 items-center justify-center mb-3">
              <Text className="text-emerald-400 text-2xl font-bold">
                {userFullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text className="text-white text-lg font-semibold mb-0.5">{userFullName}</Text>
          <Text className="text-zinc-400 text-sm mb-4">{userEmail}</Text>

          <View className="flex-row border-t border-white/[0.06] pt-4 w-full justify-around">
            <View className="items-center">
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Joined</Text>
              <Text className="text-white text-xs font-medium">{joinedDate}</Text>
            </View>
            <View className="w-[1px] bg-white/[0.06]" />
            <View className="items-center">
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Status</Text>
              <Text className="text-emerald-400 text-xs font-semibold">Active</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <Text className="text-zinc-500 text-[11px] uppercase font-bold tracking-widest mb-3 ml-1">Statistics</Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 items-center">
            <Text className="text-2xl mb-1">💳</Text>
            <Text className="text-white text-lg font-bold">{totalTxCount}</Text>
            <Text className="text-zinc-400 text-[10px] uppercase font-medium mt-0.5">Tx Count</Text>
          </View>
          
          <View className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 items-center">
            <Text className="text-2xl mb-1">🎯</Text>
            <Text className="text-white text-lg font-bold">{totalBudgetsCount}</Text>
            <Text className="text-zinc-400 text-[10px] uppercase font-medium mt-0.5">Budgets</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 items-center">
            <Text className="text-2xl mb-1">🏷️</Text>
            <Text className="text-white text-lg font-bold">{totalCategoriesCount}</Text>
            <Text className="text-zinc-400 text-[10px] uppercase font-medium mt-0.5">Categories</Text>
          </View>
        </View>

        {/* Options List */}
        <Text className="text-zinc-500 text-[11px] uppercase font-bold tracking-widest mb-3 ml-1">Preferences</Text>
        <View className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden mb-6">
          <TouchableOpacity 
            onPress={() => router.push("/")}
            className="flex-row justify-between items-center p-4 border-b border-white/[0.06] active:bg-white/[0.04]"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-base">📊</Text>
              <Text className="text-white text-sm font-medium">Go to Dashboard</Text>
            </View>
            <Text className="text-zinc-500 text-sm">➔</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/transactions")}
            className="flex-row justify-between items-center p-4 border-b border-white/[0.06] active:bg-white/[0.04]"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-base">💳</Text>
              <Text className="text-white text-sm font-medium">Manage Transactions</Text>
            </View>
            <Text className="text-zinc-500 text-sm">➔</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/budgets")}
            className="flex-row justify-between items-center p-4 border-b border-white/[0.06] active:bg-white/[0.04]"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-base">🎯</Text>
              <Text className="text-white text-sm font-medium">Manage Budgets</Text>
            </View>
            <Text className="text-zinc-500 text-sm">➔</Text>
          </TouchableOpacity>

          <View className="flex-row justify-between items-center p-4 border-b border-white/[0.06]">
            <View className="flex-row items-center gap-3">
              <Text className="text-base">💵</Text>
              <Text className="text-white text-sm font-medium">Default Currency</Text>
            </View>
            <Text className="text-emerald-400 text-xs font-semibold">BDT (৳)</Text>
          </View>

          <View className="flex-row justify-between items-center p-4">
            <View className="flex-row items-center gap-3">
              <Text className="text-base">📱</Text>
              <Text className="text-white text-sm font-medium">App Version</Text>
            </View>
            <Text className="text-zinc-500 text-xs">v1.0.0 (Expo)</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={signOut}
          disabled={isAuthLoading}
          className="w-full bg-red-500/10 border border-red-500/20 active:bg-red-500/20 rounded-xl py-3.5 items-center justify-center flex-row gap-2"
        >
          <Text className="text-red-400 text-sm font-bold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
