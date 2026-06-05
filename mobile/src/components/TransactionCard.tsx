import { View, Text, TouchableOpacity } from "react-native";
import { Transaction } from "@/stores/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  const paymentIcon =
    typeof transaction.paymentMethodId === "object"
      ? transaction.paymentMethodId.icon || "💵"
      : "💵";

  return (
    <TouchableOpacity
      className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 flex-row items-center active:opacity-70"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Category Icon */}
      <View
        className="w-11 h-11 rounded-2xl items-center justify-center"
        style={{ backgroundColor: `${categoryColor}18` }}
      >
        <Text className="text-xl">{categoryIcon}</Text>
      </View>

      {/* Info */}
      <View className="flex-1 ml-3 gap-0.5">
        <Text className="text-white text-sm font-semibold" numberOfLines={1}>
          {categoryName}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-zinc-500 text-xs">
            {formatDate(transaction.timestamp)}
          </Text>
          {transaction.note ? (
            <>
              <Text className="text-zinc-600">•</Text>
              <Text className="text-zinc-500 text-xs flex-1" numberOfLines={1}>
                {transaction.note}
              </Text>
            </>
          ) : null}
        </View>
        {/* Metadata pills */}
        <View className="flex-row gap-1.5 mt-1">
          <View className="bg-white/[0.04] border border-white/[0.05] rounded-md px-1.5 py-0.5 flex-row items-center gap-0.5">
            <Text className="text-[10px]">{paymentIcon}</Text>
          </View>
          {transaction.tags && transaction.tags.length > 0 && (
            <View className="bg-white/[0.04] border border-white/[0.05] rounded-md px-1.5 py-0.5">
              <Text className="text-zinc-500 text-[10px]">
                {transaction.tags.slice(0, 2).join(", ")}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount */}
      <View className="items-end ml-2">
        <Text
          className={`text-base font-bold ${
            isIncome ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amountMinor)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
