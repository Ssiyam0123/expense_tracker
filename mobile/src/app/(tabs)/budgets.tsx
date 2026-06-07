import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useBudgetStore, Budget } from "@/stores/budgets";
import { useCategoryStore } from "@/stores/categories";
import { useDashboardStore } from "@/stores/dashboard";
import { formatCurrency, getCurrentMonthYear, fromMinorUnits } from "@/lib/utils";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BudgetsScreen() {
  const { budgets, isLoading, error, fetchBudgets, addBudget, updateBudget, removeBudget } =
    useBudgetStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { summary, fetchSummary } = useDashboardStore();

  const { month, year } = getCurrentMonthYear();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [alertPercent, setAlertPercent] = useState("80");

  useEffect(() => {
    fetchBudgets(month, year);
    fetchCategories();
    fetchSummary(month, year);
  }, []);

  const handleRefresh = () => {
    fetchBudgets(month, year);
    fetchCategories();
    fetchSummary(month, year);
  };

  const handleAddBudget = async () => {
    if (!selectedCategory || !budgetAmount) return;
    const amountMinor = Math.round(parseFloat(budgetAmount) * 100);
    await addBudget({
      categoryId: selectedCategory,
      amountMinor,
      month,
      year,
      alertThreshold: parseInt(alertPercent) || 80,
    });
    setShowAddModal(false);
    setSelectedCategory("");
    setBudgetAmount("");
    setAlertPercent("80");
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const getCategoryName = (budget: Budget): string => {
    let id = "";
    if (typeof budget.categoryId === "object" && budget.categoryId !== null) {
      if (budget.categoryId.name) {
        return budget.categoryId.name;
      }
      id = budget.categoryId._id;
    } else if (typeof budget.categoryId === "string") {
      id = budget.categoryId;
    }

    if (id) {
      const cat = categories.find((c) => c._id === id);
      if (cat) return cat.name;
    }
    return "Unknown";
  };

  const getCategoryIcon = (budget: Budget): string => {
    let id = "";
    if (typeof budget.categoryId === "object" && budget.categoryId !== null) {
      if (budget.categoryId.icon) {
        return budget.categoryId.icon;
      }
      id = budget.categoryId._id;
    } else if (typeof budget.categoryId === "string") {
      id = budget.categoryId;
    }

    if (id) {
      const cat = categories.find((c) => c._id === id);
      if (cat) return cat.icon || "📌";
    }
    return "📌";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right"]}>
      {/* Neon blobs */}
      <View className="absolute bottom-[-50] right-[-40] w-[200px] h-[200px] bg-emerald-500 rounded-full opacity-8" />

      <ScrollView
        className="flex-1 px-5 pt-6"
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
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-2xl font-bold">Budgets</Text>
          <TouchableOpacity
            className="bg-emerald-500 rounded-xl px-4 py-2"
            onPress={() => setShowAddModal(true)}
          >
            <Text className="text-white text-sm font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {isLoading && budgets.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : budgets.length === 0 ? (
          <View className="py-20 items-center gap-2">
            <Text className="text-4xl">🎯</Text>
            <Text className="text-zinc-500 text-base">No budgets set</Text>
            <TouchableOpacity
              className="bg-emerald-500 rounded-xl px-6 py-3 mt-2"
              onPress={() => setShowAddModal(true)}
            >
              <Text className="text-white font-semibold">Set a budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3">
            {budgets.map((budget) => {
              const categoryIdStr =
                typeof budget.categoryId === "object"
                  ? budget.categoryId._id
                  : budget.categoryId;
              
              // Find matching computed status from the dashboard store
              const status = summary?.budgetStatus?.find(
                (s) => s.categoryId === categoryIdStr
              );

              const spent = status ? status.spentAmount : 0;
              const limit = budget.amountMinor;
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              const isOver = spent > limit;
              const isNear = !isOver && limit > 0 && (spent / limit) * 100 >= (budget.alertThreshold || 80);

              return (
                <View
                  key={budget._id}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 gap-3"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{getCategoryIcon(budget)}</Text>
                      <Text className="text-white text-sm font-semibold tracking-tight">
                        {getCategoryName(budget)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeBudget(budget._id)}
                      className="bg-red-500/10 rounded-lg px-2.5 py-1"
                    >
                      <Text className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="gap-1.5">
                    {/* Progress Bar */}
                    <View className="h-1.5 overflow-hidden rounded-full bg-white/[0.06] mb-1">
                      <View
                        className={`h-full rounded-full ${
                          isOver
                            ? "bg-red-500"
                            : isNear
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </View>

                    <View className="flex-row justify-between font-mono text-[10px] text-zinc-500">
                      <Text className="text-zinc-500">
                        ৳{fromMinorUnits(spent).toLocaleString()} spent
                      </Text>
                      <Text className="text-zinc-500">
                        Limit ৳{fromMinorUnits(limit).toLocaleString()}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center mt-1">
                      <Text className="text-zinc-600 text-[9px] font-mono">
                        Alert at {budget.alertThreshold || 80}% limit
                      </Text>
                      {isOver ? (
                        <Text className="text-red-400 text-[9px] font-semibold">Over budget!</Text>
                      ) : isNear ? (
                        <Text className="text-yellow-400 text-[9px] font-semibold">Near limit</Text>
                      ) : (
                        <Text className="text-emerald-400 text-[9px] font-semibold">{pct}% used</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-zinc-900 rounded-t-3xl p-6 gap-4 border-t border-white/[0.08]">
            <Text className="text-white text-xl font-bold">New Budget</Text>

            {/* Category picker */}
            <View className="gap-2">
              <Text className="text-zinc-400 text-sm">Category</Text>
              <ScrollView className="max-h-40" nestedScrollEnabled>
                {expenseCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    className={`rounded-xl px-4 py-3 mb-1 ${
                      selectedCategory === cat._id
                        ? "bg-emerald-500/20 border border-emerald-500/40"
                        : "bg-white/[0.04] border border-white/[0.06]"
                    }`}
                    onPress={() => setSelectedCategory(cat._id)}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text>{cat.icon || "📌"}</Text>
                      <Text className="text-white text-sm">{cat.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Amount */}
            <View className="gap-2">
              <Text className="text-zinc-400 text-sm">Monthly Budget (BDT)</Text>
              <TextInput
                className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-base"
                placeholder="e.g. 5000"
                placeholderTextColor="#71717a"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Alert threshold */}
            <View className="gap-2">
              <Text className="text-zinc-400 text-sm">Alert at (%)</Text>
              <TextInput
                className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-base"
                value={alertPercent}
                onChangeText={setAlertPercent}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl py-3.5 items-center"
                onPress={() => setShowAddModal(false)}
              >
                <Text className="text-zinc-400 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-emerald-500 rounded-xl py-3.5 items-center"
                onPress={handleAddBudget}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
