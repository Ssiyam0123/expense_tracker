import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useDashboardStore, DashboardSummary } from "@/stores/dashboard";
import { useCategoryStore } from "@/stores/categories";
import { formatCurrency, getCurrentMonthYear } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardScreen() {
  const router = useRouter();
  const { summary, isLoading, error, fetchSummary } = useDashboardStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { signOut } = useAuthStore();

  useEffect(() => {
    fetchSummary();
    fetchCategories();
  }, []);

  const { month, year } = getCurrentMonthYear();

  const handleRefresh = () => {
    fetchSummary(month, year);
    fetchCategories();
  };

  const quickLogIncome = () => {
    router.push("/modal/add-transaction?type=income");
  };

  const quickLogExpense = () => {
    router.push("/modal/add-transaction?type=expense");
  };

  return (
    <View className="flex-1 bg-black">
      {/* Neon blobs */}
      <View className="absolute top-[-60] right-[-20] w-[180] h-[180] bg-emerald-500 rounded-full opacity-10" />
      <View className="absolute top-[200] left-[-40] w-[140] h-[140] bg-emerald-600 rounded-full opacity-8" />

      <ScrollView
        className="flex-1 px-5 pt-14"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#22c55e"
          />
        }
        contentContainerClassName="pb-28"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-zinc-400 text-sm">
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <Text className="text-white text-2xl font-bold">Dashboard</Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2"
          >
            <Text className="text-zinc-400 text-sm">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {error && !summary && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {isLoading && !summary ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <Text className="text-zinc-400 text-xs mb-1">Income</Text>
                <Text className="text-emerald-400 text-xl font-bold">
                  +{formatCurrency(summary.totalIncome)}
                </Text>
              </View>
              <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <Text className="text-zinc-400 text-xs mb-1">Expenses</Text>
                <Text className="text-red-400 text-xl font-bold">
                  -{formatCurrency(summary.totalExpense)}
                </Text>
              </View>
            </View>

            {/* Balance Card */}
            <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 mb-6">
              <Text className="text-zinc-400 text-xs mb-1">Balance</Text>
              <Text
                className={`text-3xl font-bold ${
                  summary.balance >= 0 ? "text-white" : "text-red-400"
                }`}
              >
                {formatCurrency(summary.balance)}
              </Text>
            </View>

            {/* Quick Log Buttons */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center"
                onPress={quickLogIncome}
              >
                <Text className="text-white text-base font-semibold">
                  + Add Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-2xl py-4 items-center"
                onPress={quickLogExpense}
              >
                <Text className="text-white text-base font-semibold">
                  - Add Expense
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Breakdown */}
            {summary.categoryBreakdown.length > 0 && (
              <>
                <Text className="text-white text-lg font-semibold mb-3">
                  Spending Breakdown
                </Text>
                <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 gap-3 mb-6">
                  {summary.categoryBreakdown.map((cat) => (
                    <View key={cat.categoryId} className="gap-1.5">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-lg">
                            {cat.categoryIcon || "📌"}
                          </Text>
                          <Text className="text-zinc-300 text-sm">
                            {cat.categoryName}
                          </Text>
                        </View>
                        <Text className="text-white text-sm font-semibold">
                          {formatCurrency(cat.total)}
                        </Text>
                      </View>
                      {/* Progress bar */}
                      <View className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              summary.totalExpense > 0
                                ? Math.min(
                                    (cat.total / summary.totalExpense) * 100,
                                    100
                                  )
                                : 0
                            }%`,
                            backgroundColor: cat.categoryColor || "#22c55e",
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Budget Status */}
            {summary.budgetStatus.length > 0 && (
              <>
                <Text className="text-white text-lg font-semibold mb-3">
                  Budget Status
                </Text>
                <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 gap-3 mb-6">
                  {summary.budgetStatus.map((budget) => (
                    <View key={budget.budgetId} className="gap-1.5">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-zinc-300 text-sm">
                          {budget.categoryName}
                        </Text>
                        <Text
                          className={`text-sm font-semibold ${
                            budget.isOverBudget
                              ? "text-red-400"
                              : budget.isNearThreshold
                              ? "text-yellow-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {formatCurrency(budget.spentAmount)} /{" "}
                          {formatCurrency(budget.budgetAmount)}
                        </Text>
                      </View>
                      {/* Budget progress bar */}
                      <View className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <View
                          className={`h-full rounded-full ${
                            budget.isOverBudget
                              ? "bg-red-500"
                              : budget.isNearThreshold
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(budget.percentage, 100)}%`,
                          }}
                        />
                      </View>
                      <Text
                        className={`text-xs ${
                          budget.isOverBudget
                            ? "text-red-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {budget.percentage}% used
                        {budget.isOverBudget
                          ? " • Over budget!"
                          : budget.isNearThreshold
                          ? " • Near limit"
                          : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
