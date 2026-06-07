import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useCategoryStore, Category } from "@/stores/categories";
import { useToastStore } from "@/stores/toast";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { categories, fetchCategories, addCategory, updateCategory, removeCategory } = useCategoryStore();
  const { showToast } = useToastStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("📌");
  const [color, setColor] = useState("#10B981");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), icon, color, type });
        setEditingId(null);
        showToast("Category updated successfully!", "success");
      } else {
        await addCategory({ name: name.trim(), icon, color, type });
        showToast("Category created successfully!", "success");
      }
      setName("");
      setIcon("📌");
      setColor("#10B981");
    } catch (err) {
      setError((err as Error).message || "Failed to save category");
      showToast("Failed to save category", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectForEdit = (cat: Category) => {
    setEditingId(cat._id);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon || "📌");
    setColor(cat.color || "#10B981");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setIcon("📌");
    setColor("#10B981");
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${cat.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeCategory(cat._id);
              showToast("Category deleted successfully!", "success");
              if (editingId === cat._id) {
                handleCancelEdit();
              }
            } catch (err) {
              setError("Failed to delete category");
              showToast("Failed to delete category", "error");
            }
          },
        },
      ]
    );
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right"]}>
        {/* Neon blobs */}
        <View className="absolute top-[-50] left-[-50] w-[180px] h-[180px] bg-emerald-500 rounded-full opacity-10" />
        
        <ScrollView
          className="flex-1 px-5 pt-6"
          contentContainerClassName="pb-10"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-emerald-400 text-sm font-semibold">Done</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold tracking-tight">
              {editingId ? "Edit Category" : "Categories"}
            </Text>
            <View className="w-12" />
          </View>

          {/* Type toggle */}
          <View className="flex-row bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 mb-5">
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-xl items-center ${
                type === "expense" ? "bg-red-500" : ""
              }`}
              onPress={() => setType("expense")}
            >
              <Text
                className={`font-semibold text-xs uppercase tracking-wide ${
                  type === "expense" ? "text-white" : "text-zinc-500"
                }`}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-xl items-center ${
                type === "income" ? "bg-emerald-500" : ""
              }`}
              onPress={() => setType("income")}
            >
              <Text
                className={`font-semibold text-xs uppercase tracking-wide ${
                  type === "income" ? "text-white" : "text-zinc-500"
                }`}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-xs font-semibold mb-2">Category Name</Text>
            <TextInput
              className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 text-white text-base"
              placeholder="e.g. Groceries"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Icon picker */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-zinc-400 text-xs font-semibold">Select Icon</Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-zinc-400 text-[10px] font-semibold">Custom:</Text>
                <TextInput
                  className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1 text-white text-xs w-10 text-center"
                  placeholder="📌"
                  placeholderTextColor="#71717a"
                  value={icon}
                  onChangeText={(text) => {
                    const lastChar = Array.from(text).pop() || "📌";
                    setIcon(lastChar);
                  }}
                  maxLength={4}
                />
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_ICONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    icon === emoji
                      ? "bg-white/[0.15] border border-white/[0.2]"
                      : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                  onPress={() => setIcon(emoji)}
                >
                  <Text className="text-lg">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color picker */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-zinc-400 text-xs font-semibold">Select Color</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-zinc-400 text-[10px] font-semibold">HEX:</Text>
                <TextInput
                  className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1 text-white text-xs w-20 text-center font-mono"
                  placeholder="#10B981"
                  placeholderTextColor="#71717a"
                  value={color}
                  onChangeText={(text) => {
                    let formatted = text;
                    if (formatted && !formatted.startsWith("#")) {
                      formatted = "#" + formatted;
                    }
                    setColor(formatted);
                  }}
                  maxLength={7}
                  autoCapitalize="characters"
                />
                <View
                  className="w-5 h-5 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2.5">
              {CATEGORY_COLORS.map((clr) => (
                <TouchableOpacity
                  key={clr}
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    color === clr ? "border border-white" : ""
                  }`}
                  style={{ backgroundColor: clr }}
                  onPress={() => setColor(clr)}
                >
                  {color === clr && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <Text className="text-red-400 text-xs">{error}</Text>
            </View>
          )}

          {/* Save / Update Buttons */}
          <View className="flex-row gap-3 mb-8">
            {editingId && (
              <TouchableOpacity
                className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl py-3.5 items-center"
                onPress={handleCancelEdit}
              >
                <Text className="text-zinc-400 text-sm font-semibold">Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 bg-emerald-500 rounded-xl py-3.5 items-center"
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-sm font-semibold">
                  {editingId ? "Update Category" : "+ Add Category"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Existing Categories List */}
          <Text className="text-white text-sm font-bold tracking-tight mb-3">
            Existing {type === "expense" ? "Expense" : "Income"} Categories
          </Text>

          {filteredCategories.length > 0 ? (
            <View className="gap-2.5">
              {filteredCategories.map((cat) => (
                <View
                  key={cat._id}
                  className="flex-row justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-xl p-3"
                >
                  <TouchableOpacity
                    className="flex-row items-center gap-2.5 flex-1"
                    onPress={() => handleSelectForEdit(cat)}
                  >
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center bg-white/[0.04] border border-white/[0.06]"
                    >
                      <Text className="text-base">{cat.icon || "📌"}</Text>
                    </View>
                    <Text className="text-white text-sm font-medium tracking-tight">
                      {cat.name}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(cat)}
                    className="bg-red-500/10 rounded-lg px-2.5 py-1"
                  >
                    <Text className="text-red-400 text-[10px] font-bold uppercase tracking-wider">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-zinc-500 text-xs italic text-center py-4">
              No categories configured for {type}.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
