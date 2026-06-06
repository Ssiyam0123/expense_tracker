import { View, Text, TouchableOpacity } from "react-native";
import { Transaction } from "@/stores/transactions";
import { formatCurrency, formatDate, fromMinorUnits } from "@/lib/utils";

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TransactionCard({
  transaction,
  onPress,
  onLongPress,
}: TransactionCardProps) {
  const isIncome = transaction.type === "income";

  const categoryName =
    typeof transaction.categoryId === "object"
      ? transaction.categoryId.name || "Unknown"
      : transaction.categoryId;

  const categoryIcon =
    typeof transaction.categoryId === "object"
      ? transaction.categoryId.icon || "📌"
      : "📌";

  const categoryColor =
    typeof transaction.categoryId === "object"
      ? transaction.categoryId.color || "#71717a"
      : "#71717a";

  const paymentName =
    typeof transaction.paymentMethodId === "object"
      ? transaction.paymentMethodId.name || "Unknown"
      : "Unknown";

  const paymentIcon =
    typeof transaction.paymentMethodId === "object"
      ? transaction.paymentMethodId.icon || "💵"
      : "💵";

  return (
    <TouchableOpacity
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex-row items-center active:opacity-80 mb-2.5"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Type left border accent */}
      <View
        className={`absolute left-0 top-0 bottom-0 w-[4.5] ${
          isIncome ? "bg-emerald-500" : "bg-red-500"
        }`}
      />

      {/* Category Icon */}
      <View
        className="w-11 h-11 rounded-xl items-center justify-center bg-white/[0.04] border border-white/[0.06] shadow-sm ml-1"
        style={{ shadowColor: categoryColor, shadowOpacity: 0.1, shadowRadius: 8 }}
      >
        <Text className="text-xl">{categoryIcon}</Text>
      </View>

      {/* Info */}
      <View className="flex-1 ml-3.5 gap-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-white text-sm font-semibold tracking-tight truncate max-w-[120]">
            {categoryName}
          </Text>
          <View className={`rounded-full px-2 py-0.5 border ${
            isIncome 
              ? "bg-emerald-500/10 border-emerald-500/20" 
              : "bg-red-500/10 border-red-500/20"
          }`}>
            <Text className={`text-[8px] font-bold uppercase tracking-wider ${
              isIncome ? "text-emerald-400" : "text-red-400"
            }`}>
              {transaction.type}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5 flex-wrap text-xs text-zinc-500">
          {/* Payment Method Pill */}
          <View className="bg-white/[0.03] border border-white/[0.05] rounded-md px-1.5 py-0.5 flex-row items-center gap-1">
            <Text className="text-[10px]">{paymentIcon}</Text>
            <Text className="text-zinc-300 text-[9px] font-semibold">{paymentName}</Text>
          </View>

          {/* Date Label */}
          <Text className="text-[10px] font-mono text-zinc-500">
            📅 {formatDate(transaction.timestamp)}
          </Text>
        </View>

        {transaction.note ? (
          <Text className="text-zinc-500 text-[10px] italic mt-0.5 truncate" numberOfLines={1}>
            💬 {transaction.note}
          </Text>
        ) : null}
      </View>

      {/* Amount */}
      <View className="items-end ml-2 shrink-0">
        <Text
          className={`font-mono text-base font-bold tracking-tight ${
            isIncome ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isIncome ? "+" : "−"}৳{fromMinorUnits(transaction.amountMinor).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
