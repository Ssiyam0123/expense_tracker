import { useEffect, useState } from "react";
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
import { TransactionCard } from "@/components/TransactionCard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionsScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    deleteTransaction,
  } = useTransactionStore();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefresh = () => {
    const params: Record<string, string> = {};
    if (filter !== "all") params.type = filter;
    fetchTransactions(params);
  };

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const handleDelete = (localId: string) => {
    deleteTransaction(localId);
  };

  const handleAdd = () => {
    router.push("/modal/add-transaction");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right"]}>
      {/* Neon blobs */}
      <View className="absolute top-[-40] left-[-30] w-[150] h-[150] bg-emerald-500 rounded-full opacity-8" />

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
          <TouchableOpacity
            className="bg-emerald-500 rounded-xl px-4 py-2"
            onPress={handleAdd}
          >
            <Text className="text-white text-sm font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View className="flex-row gap-2 mb-4">
          {(["all", "income", "expense"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              className={`rounded-xl px-4 py-2 ${
                filter === f
                  ? "bg-white/[0.12] border border-white/[0.2]"
                  : "bg-white/[0.04] border border-white/[0.06]"
              }`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`text-sm capitalize ${
                  filter === f ? "text-white" : "text-zinc-500"
                }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {isLoading && filtered.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-20 items-center gap-2">
            <Text className="text-4xl">📭</Text>
            <Text className="text-zinc-500 text-base">No transactions yet</Text>
            <TouchableOpacity
              className="bg-emerald-500 rounded-xl px-6 py-3 mt-2"
              onPress={handleAdd}
            >
              <Text className="text-white font-semibold">
                Add your first transaction
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-2">
            {filtered.map((txn) => (
              <TransactionCard
                key={txn.localId || txn._id}
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
      </ScrollView>
    </SafeAreaView>
  );
}
