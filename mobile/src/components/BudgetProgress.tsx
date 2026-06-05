import { View, Text } from "react-native";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";

interface BudgetProgressProps {
  budgetId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  alertThreshold: number;
  isOverBudget: boolean;
  isNearThreshold: boolean;
}

export function BudgetProgress({
  categoryName,
  budgetAmount,
  spentAmount,
  percentage,
  isOverBudget,
  isNearThreshold,
}: BudgetProgressProps) {
  const statusColor = isOverBudget
    ? "bg-red-500"
    : isNearThreshold
    ? "bg-yellow-500"
    : "bg-emerald-500";

  const textColor = isOverBudget
    ? "text-red-400"
    : isNearThreshold
    ? "text-yellow-400"
    : "text-zinc-400";

  return (
    <View className="gap-1.5">
      <View className="flex-row justify-between items-center">
        <Text className="text-zinc-300 text-sm">{categoryName}</Text>
        <Text className={`text-sm font-semibold ${textColor}`}>
          {formatCurrencyCompact(spentAmount)} /{" "}
          {formatCurrencyCompact(budgetAmount)}
        </Text>
      </View>
      {/* Budget progress bar */}
      <View className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${statusColor}`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </View>
      <Text
        className={`text-xs ${
          isOverBudget ? "text-red-400" : "text-zinc-500"
        }`}
      >
        {percentage}% used
        {isOverBudget ? " • Over budget!" : isNearThreshold ? " • Near limit" : ""}
      </Text>
    </View>
  );
}
