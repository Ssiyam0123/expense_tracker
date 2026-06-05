import { View, Text } from "react-native";

interface CategoryBreakdownProps {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    total: number;
    count: number;
  }>;
  totalExpense: number;
}

export function CategoryBreakdown({
  categories,
  totalExpense,
}: CategoryBreakdownProps) {
  if (categories.length === 0) return null;

  return (
    <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 gap-3">
      {categories.map((cat) => {
        const percentage =
          totalExpense > 0
            ? Math.min((cat.total / totalExpense) * 100, 100)
            : 0;

        return (
          <View key={cat.categoryId} className="gap-1.5">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">{cat.categoryIcon || "📌"}</Text>
                <Text className="text-zinc-300 text-sm">{cat.categoryName}</Text>
                <Text className="text-zinc-600 text-xs">({cat.count})</Text>
              </View>
              <Text className="text-white text-sm font-semibold">
                {percentage.toFixed(0)}%
              </Text>
            </View>
            {/* Progress bar */}
            <View className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: cat.categoryColor || "#22c55e",
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
