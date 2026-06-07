import { useEffect, useState } from "react";
import * as RN from "react-native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTransactionStore } from "@/stores/transactions";
import { useCategoryStore } from "@/stores/categories";
import { TransactionCard } from "@/components/TransactionCard";
import { SafeAreaView } from "react-native-safe-area-context";

const NativeInput = RN.TextInput;

export default function TransactionsScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    error,
    pagination,
    fetchTransactions,
    deleteTransaction,
  } = useTransactionStore();

  const { categories, fetchCategories } = useCategoryStore();

  // Filters & State
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [sortBy, setSortBy] = useState<"timestamp" | "amountMinor">("timestamp");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Load Categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch transactions whenever filters or page changes
  useEffect(() => {
    loadTransactions(currentPage);
  }, [typeFilter, selectedCategoryId, dateRange, startDateStr, endDateStr, sortBy, sortOrder, currentPage]);

  const loadTransactions = (page = 1) => {
    const params: Record<string, string> = {
      page: String(page),
      limit: "20",
    };

    if (typeFilter !== "all") params.type = typeFilter;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;
    
    // Date Filters
    if (dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      params.startDate = today.toISOString();
    } else if (dateRange === "week") {
      const prevWeek = new Date();
      prevWeek.setDate(prevWeek.getDate() - 7);
      params.startDate = prevWeek.toISOString();
    } else if (dateRange === "month") {
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      params.startDate = prevMonth.toISOString();
    } else if (dateRange === "custom") {
      if (startDateStr) {
        try {
          const d = new Date(startDateStr);
          if (!isNaN(d.getTime())) params.startDate = d.toISOString();
        } catch {}
      }
      if (endDateStr) {
        try {
          const d = new Date(endDateStr);
          if (!isNaN(d.getTime())) params.endDate = d.toISOString();
        } catch {}
      }
    }

    params.sortBy = sortBy;
    params.sortOrder = sortOrder;

    fetchTransactions(params);
  };

  const handleRefresh = () => {
    loadTransactions(currentPage);
  };

  const handleDelete = (localId: string) => {
    deleteTransaction(localId);
  };

  const handleAdd = () => {
    router.push("/modal/add-transaction");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setSelectedCategoryId("");
    setDateRange("all");
    setStartDateStr("");
    setEndDateStr("");
    setSortBy("timestamp");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    typeFilter !== "all" || 
    selectedCategoryId !== "" || 
    dateRange !== "all" || 
    sortBy !== "timestamp" || 
    sortOrder !== "desc";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right"]}>
      {/* Neon blobs */}
      <View className="absolute top-[-40] left-[-30] w-[150px] h-[150px] bg-emerald-500 rounded-full opacity-8" />

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
          <Text className="text-white text-2xl font-bold">Transactions</Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className={`rounded-xl px-3.5 py-2 flex-row gap-1.5 items-center border ${
                showFilters || hasActiveFilters
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.04] border-white/[0.06] text-zinc-400"
              }`}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text className={`text-xs font-semibold ${showFilters || hasActiveFilters ? "text-emerald-400" : "text-zinc-400"}`}>
                🔍 Filters {hasActiveFilters ? "•" : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-emerald-500 rounded-xl px-4 py-2"
              onPress={handleAdd}
            >
              <Text className="text-white text-sm font-semibold">+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <View className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 gap-4 mb-4">
            {/* Type */}
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Type</Text>
              <View className="flex-row gap-2">
                {(["all", "income", "expense"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    className={`rounded-lg px-3 py-1.5 border ${
                      typeFilter === f
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-white/[0.02] border-white/[0.05]"
                    }`}
                    onPress={() => {
                      setTypeFilter(f);
                      setCurrentPage(1);
                    }}
                  >
                    <Text className={`text-xs capitalize ${typeFilter === f ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                <TouchableOpacity
                  className={`rounded-lg px-3 py-1.5 border mr-2 ${
                    selectedCategoryId === ""
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-white/[0.02] border-white/[0.05]"
                  }`}
                  onPress={() => {
                    setSelectedCategoryId("");
                    setCurrentPage(1);
                  }}
                >
                  <Text className={`text-xs ${selectedCategoryId === "" ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    className={`rounded-lg px-3 py-1.5 border mr-2 flex-row gap-1 items-center ${
                      selectedCategoryId === c._id
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-white/[0.02] border-white/[0.05]"
                    }`}
                    onPress={() => {
                      setSelectedCategoryId(c._id);
                      setCurrentPage(1);
                    }}
                  >
                    <Text className="text-xs">{c.icon || "🏷️"}</Text>
                    <Text className={`text-xs ${selectedCategoryId === c._id ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date Range Options */}
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Date Range</Text>
              <View className="flex-row flex-wrap gap-2">
                {(["all", "today", "week", "month", "custom"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    className={`rounded-lg px-3 py-1.5 border ${
                      dateRange === r
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-white/[0.02] border-white/[0.05]"
                    }`}
                    onPress={() => {
                      setDateRange(r);
                      setCurrentPage(1);
                    }}
                  >
                    <Text className={`text-xs capitalize ${dateRange === r ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                      {r === "all" ? "All Time" : r === "week" ? "Last 7 Days" : r === "month" ? "Last 30 Days" : r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Date Inputs */}
              {dateRange === "custom" && (
                <View className="flex-row gap-2 mt-3">
                  <View className="flex-1">
                    <Text className="text-zinc-500 text-[9px] mb-1">Start Date (YYYY-MM-DD)</Text>
                    <NativeInput
                      value={startDateStr}
                      onChangeText={(val) => {
                        setStartDateStr(val);
                        setCurrentPage(1);
                      }}
                      placeholder="e.g. 2026-06-01"
                      placeholderTextColor="rgba(255,255,255,0.15)"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        color: "#fff",
                        fontSize: 12,
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-500 text-[9px] mb-1">End Date (YYYY-MM-DD)</Text>
                    <NativeInput
                      value={endDateStr}
                      onChangeText={(val) => {
                        setEndDateStr(val);
                        setCurrentPage(1);
                      }}
                      placeholder="e.g. 2026-06-30"
                      placeholderTextColor="rgba(255,255,255,0.15)"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        color: "#fff",
                        fontSize: 12,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Sorting */}
            <View className="flex-row gap-4 pt-2 border-t border-white/[0.04]">
              {/* Sort By */}
              <View className="flex-1">
                <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Sort By</Text>
                <View className="flex-row gap-2">
                  {(["timestamp", "amountMinor"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      className={`flex-1 rounded-lg py-1.5 border items-center ${
                        sortBy === s
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-white/[0.02] border-white/[0.05]"
                      }`}
                      onPress={() => {
                        setSortBy(s);
                        setCurrentPage(1);
                      }}
                    >
                      <Text className={`text-xs ${sortBy === s ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                        {s === "timestamp" ? "Date" : "Amount"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Order */}
              <View className="flex-1">
                <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Order</Text>
                <View className="flex-row gap-2">
                  {(["desc", "asc"] as const).map((o) => (
                    <TouchableOpacity
                      key={o}
                      className={`flex-1 rounded-lg py-1.5 border items-center ${
                        sortOrder === o
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-white/[0.02] border-white/[0.05]"
                      }`}
                      onPress={() => {
                        setSortOrder(o);
                        setCurrentPage(1);
                      }}
                    >
                      <Text className={`text-xs uppercase ${sortOrder === o ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                        {o}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Reset Button */}
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetFilters}
                className="w-full bg-red-500/10 border border-red-500/20 active:bg-red-500/20 rounded-xl py-2 items-center justify-center"
              >
                <Text className="text-red-400 text-xs font-bold">Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {error && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {isLoading && transactions.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : transactions.length === 0 ? (
          <View className="py-20 items-center gap-2">
            <Text className="text-4xl">📭</Text>
            <Text className="text-zinc-500 text-base">No transactions found</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                className="bg-zinc-900 border border-white/[0.08] rounded-xl px-4 py-2 mt-2"
                onPress={resetFilters}
              >
                <Text className="text-white text-xs font-semibold">Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="gap-2">
            {transactions.map((txn, index) => (
              <TransactionCard
                key={txn.localId || txn._id || `txn_${index}`}
                transaction={txn}
                onPress={() =>
                  router.push(
                    `/modal/edit-transaction?id=${txn.localId || txn._id}`
                  )
                }
                onLongPress={() => handleDelete(txn.localId)}
              />
            ))}
          </View>
        )}

        {/* Server-side Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <View className="flex-row items-center justify-between mt-6 pt-4 border-t border-white/[0.08] mb-10">
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Pagination</Text>
              <Text className="text-zinc-400 text-xs font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={`rounded-xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] active:bg-white/[0.08] ${
                  pagination.page <= 1 ? "opacity-30" : ""
                }`}
              >
                <Text className="text-white text-xs font-bold">◀ Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className={`rounded-xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] active:bg-white/[0.08] ${
                  pagination.page >= pagination.totalPages ? "opacity-30" : ""
                }`}
              >
                <Text className="text-white text-xs font-bold">Next ▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
