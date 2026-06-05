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
import { usePaymentMethodStore } from "@/stores/payment-methods";
import { parseToMinorUnits } from "@/lib/utils";

export default function AddTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { addTransaction } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethodStore();

  const [txType, setTxType] = useState<"income" | "expense">(
    (params.type as "income" | "expense") || "expense"
  );
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
  }, []);

  const filteredCategories = categories.filter((c) => c.type === txType);

  const handleSave = async () => {
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    if (!paymentMethodId) {
      setError("Please select a payment method");
      return;
    }

    setIsSaving(true);
    try {
      const amountMinor = parseToMinorUnits(amount);
      await addTransaction({
        amountMinor,
        type: txType,
        categoryId,
        paymentMethodId,
        note: note || undefined,
      });
      router.back();
    } catch (err) {
      setError((err as Error).message || "Failed to save");
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
              New Transaction
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
              autoFocus
            />
          </View>

          {/* Categories */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  className={`rounded-2xl px-4 py-3 items-center gap-1 min-w-[80] ${
                    categoryId === cat._id
                      ? "bg-white/[0.12] border border-white/[0.2]"
                      : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                  onPress={() => setCategoryId(cat._id)}
                >
                  <Text className="text-2xl">{cat.icon || "📌"}</Text>
                  <Text
                    className={`text-xs ${
                      categoryId === cat._id ? "text-white" : "text-zinc-500"
                    }`}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Payment method */}
          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Payment Method</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {paymentMethods.map((pm) => (
                <TouchableOpacity
                  key={pm._id}
                  className={`rounded-2xl px-4 py-3 items-center gap-1 min-w-[80] ${
                    paymentMethodId === pm._id
                      ? "bg-white/[0.12] border border-white/[0.2]"
                      : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                  onPress={() => setPaymentMethodId(pm._id)}
                >
                  <Text className="text-2xl">{pm.icon || "💵"}</Text>
                  <Text
                    className={`text-xs ${
                      paymentMethodId === pm._id ? "text-white" : "text-zinc-500"
                    }`}
                    numberOfLines={1}
                  >
                    {pm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Note */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Note (optional)</Text>
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
            className={`${
              txType === "income" ? "bg-emerald-500" : "bg-red-500"
            } rounded-2xl py-4 items-center ${isSaving ? "opacity-70" : ""}`}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                {txType === "income" ? "+ Add Income" : "- Add Expense"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
