import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useCategoryStore } from "@/stores/categories";
import { usePaymentMethodStore } from "@/stores/payment-methods";

const CATEGORY_COLORS = [
  "#10B981", "#3B82F6", "#EC4899", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#EAB308", "#22C55E", "#6366F1",
];

const CATEGORY_ICONS = [
  "🍔", "🏠", "🚗", "🎬", "🛒", "⚡", "💼", "📈", "🎁", "💊",
  "✈️", "📚", "💪", "🐱", "🎵", "📱", "☕", "👕", "💻", "🏦",
];

export default function AddCategoryModal() {
  const router = useRouter();
  const { addCategory } = useCategoryStore();
  const { fetchPaymentMethods } = usePaymentMethodStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("📌");
  const [color, setColor] = useState("#10B981");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSaving(true);
    try {
      await addCategory({ name: name.trim(), icon, color, type });
      router.back();
    } catch (err) {
      setError((err as Error).message || "Failed to create category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-black">
        <ScrollView
          className="flex-1 px-5 pt-14"
          contentContainerClassName="pb-10"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-emerald-400 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              New Category
            </Text>
            <View className="w-16" />
          </View>

          {/* Type toggle */}
          <View className="flex-row bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 mb-5">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${
                type === "expense" ? "bg-red-500" : ""
              }`}
              onPress={() => setType("expense")}
            >
              <Text
                className={`font-semibold ${
                  type === "expense" ? "text-white" : "text-zinc-500"
                }`}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${
                type === "income" ? "bg-emerald-500" : ""
              }`}
              onPress={() => setType("income")}
            >
              <Text
                className={`font-semibold ${
                  type === "income" ? "text-white" : "text-zinc-500"
                }`}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Name</Text>
            <TextInput
              className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-white text-base"
              placeholder="e.g. Groceries"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={50}
            />
          </View>

          {/* Icon picker */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Icon</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_ICONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  className={`w-11 h-11 rounded-xl items-center justify-center ${
                    icon === emoji
                      ? "bg-white/[0.15] border border-white/[0.2]"
                      : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                  onPress={() => setIcon(emoji)}
                >
                  <Text className="text-xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color picker */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Color</Text>
            <View className="flex-row flex-wrap gap-3">
              {CATEGORY_COLORS.map((clr) => (
                <TouchableOpacity
                  key={clr}
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    color === clr ? "border-2 border-white" : ""
                  }`}
                  style={{ backgroundColor: clr }}
                  onPress={() => setColor(clr)}
                >
                  {color === clr && (
                    <Text className="text-white font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Save */}
          <TouchableOpacity
            className="bg-emerald-500 rounded-2xl py-4 items-center"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Save Category
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
