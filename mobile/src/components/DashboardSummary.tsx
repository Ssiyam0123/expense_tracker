import { View, Text, TouchableOpacity } from "react-native";

interface SummaryCardProps {
  label: string;
  value: string;
  prefix?: string;
  className?: string;
  valueClassName?: string;
}

export function SummaryCard({
  label,
  value,
  prefix,
  className,
  valueClassName,
}: SummaryCardProps) {
  return (
    <View
      className={`rounded-2xl p-4 border ${className || ""}`}
    >
      <Text className="text-zinc-400 text-xs mb-1">{label}</Text>
      <Text className={`text-xl font-bold ${valueClassName || ""}`}>
        {prefix ? `${prefix} ` : ""}
        {value}
      </Text>
    </View>
  );
}

interface QuickLogButtonProps {
  label: string;
  type: "income" | "expense";
  onPress: () => void;
}

export function QuickLogButton({ label, type, onPress }: QuickLogButtonProps) {
  const bgClass = type === "income" ? "bg-emerald-500" : "bg-red-500";

  return (
    <TouchableOpacity
      className={`flex-1 ${bgClass} rounded-2xl py-4 items-center active:opacity-80`}
      onPress={onPress}
    >
      <Text className="text-white text-base font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}
