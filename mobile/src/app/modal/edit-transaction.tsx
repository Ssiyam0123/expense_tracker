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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTransactionStore } from "@/stores/transactions";
import { useCategoryStore } from "@/stores/categories";
import { parseToMinorUnits, fromMinorUnits } from "@/lib/utils";

export default function EditTransactionModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, updateTransaction, deleteTransaction } =
    useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const transaction = transactions.find((t) => t.localId === id || t._id === id);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (transaction) {
      setAmount(String(fromMinorUnits(transaction.amountMinor)));
      setNote(transaction.note || "");
      setTxType(transaction.type);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!id || !transaction) return;
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSaving(true);
    try {
      const amountMinor = parseToMinorUnits(amount);
      await updateTransaction(id, {
        amountMinor,
        type: txType,
        note: note || "",
      });
      router.back();
    } catch (err) {
      setError((err as Error).message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteTransaction(id);
      router.back();
    } catch (err) {
      setError((err as Error).message || "Failed to delete");
    }
  };

  if (!transaction) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-5">
        <Text className="text-white text-base">Transaction not found</Text>
        <TouchableOpacity
          className="mt-4 bg-emerald-500 rounded-xl px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-black">
        {/* Neon blobs */}
        <View
          className={`absolute top-[-40] right-[-20] w-[160] h-[160] rounded-full opacity-10 ${
            txType === "income" ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

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
              Edit Transaction
            </Text>
            <View className="w-16" />
          </View>

          {/* Type toggle */}
          <View className="flex-row bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 mb-5">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${
                txType === "expense" ? "bg-red-500" : ""
              }`}
              onPress={() => setTxType("expense")}
            >
              <Text
                className={`font-semibold ${
                  txType === "expense" ? "text-white" : "text-zinc-500"
                }`}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${
                txType === "income" ? "bg-emerald-500" : ""
              }`}
              onPress={() => setTxType("income")}
            >
              <Text
                className={`font-semibold ${
                  txType === "income" ? "text-white" : "text-zinc-500"
                }`}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Amount (BDT)</Text>
            <TextInput
              className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-3xl font-bold text-center"
              placeholder="0.00"
              placeholderTextColor="#52525b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Current Category (read-only display) */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Category</Text>
            <View className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3.5">
              <Text className="text-zinc-400 text-base">
                {typeof transaction.categoryId === "object"
                  ? `${transaction.categoryId.icon || "📌"} ${transaction.categoryId.name || "Unknown"}`
                  : transaction.categoryId}
              </Text>
            </View>
          </View>

          {/* Note */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Note</Text>
            <TextInput
              className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-white text-base"
              placeholder="What was this for?"
              placeholderTextColor="#71717a"
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
              numberOfLines={2}
            />
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Save */}
          <TouchableOpacity
            className="bg-emerald-500 rounded-2xl py-4 items-center mb-3"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center"
            onPress={handleDelete}
          >
            <Text className="text-red-400 text-base font-semibold">
              Delete Transaction
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
