import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as RN from "react-native";
const NativeInput = RN.TextInput;
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTransactionStore } from "@/stores/transactions";
import { useCategoryStore } from "@/stores/categories";
import { usePaymentMethodStore } from "@/stores/payment-methods";
import { parseToMinorUnits } from "@/lib/utils";
import { useToastStore } from "@/stores/toast";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { addTransaction } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethodStore();

  const [txType, setTxType] = useState<"income" | "expense">(
    (params.type as "income" | "expense") || "expense"
  );
  const [txDate, setTxDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  const { showToast } = useToastStore();

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !paymentMethodId) {
      const cashPm = paymentMethods.find(
        (pm) => pm.name.toLowerCase() === "cash"
      );
      if (cashPm) {
        setPaymentMethodId(cashPm._id);
      } else {
        setPaymentMethodId(paymentMethods[0]._id);
      }
    }
  }, [paymentMethods, paymentMethodId]);

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
        timestamp: txDate.toISOString(),
      });
      showToast("Transaction logged successfully!", "success");
      router.back();
    } catch (err) {
      setError((err as Error).message || "Failed to save");
      showToast("Failed to save transaction", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right"]}>
        {/* Neon blobs */}
        <View
          className={`absolute top-[-40] right-[-20] w-[160px] h-[160px] rounded-full opacity-10 ${
            txType === "income" ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        <ScrollView
          className="flex-1 px-5 pt-6"
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
            <NativeInput
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: "bold",
                textAlign: "center",
              }}
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
              {/* Manage shortcut */}
              <TouchableOpacity
                className="rounded-2xl px-4 py-3 items-center justify-center gap-1 min-w-[80px] bg-emerald-500/10 border border-emerald-500/20"
                onPress={() => router.push("/modal/add-category")}
              >
                <Text className="text-2xl">⚙️</Text>
                <Text className="text-xs text-emerald-400 font-bold">Manage</Text>
              </TouchableOpacity>

              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  className={`rounded-2xl px-4 py-3 items-center gap-1 min-w-[80px] ${
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
                  className={`rounded-2xl px-4 py-3 items-center gap-1 min-w-[80px] ${
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
            <NativeInput
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: "#ffffff",
                fontSize: 16,
              }}
              placeholder="What was this for?"
              placeholderTextColor="#71717a"
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Date Selector */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Date</Text>
            <TouchableOpacity
              className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3.5 flex-row justify-between items-center"
              onPress={() => {
                setViewMonth(txDate.getMonth());
                setViewYear(txDate.getFullYear());
                setShowDatePicker(true);
              }}
            >
              <Text className="text-white text-base">
                📅 {txDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Text className="text-zinc-500 text-sm font-semibold">Change</Text>
            </TouchableOpacity>
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

        {/* Calendar Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/75 px-5">
            <View className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 w-full max-w-sm gap-4">
              <Text className="text-white text-lg font-bold text-center">Select Date</Text>

              {/* Month/Year Nav */}
              <View className="flex-row justify-between items-center py-2 px-1">
                <TouchableOpacity
                  onPress={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear(viewYear - 1);
                    } else {
                      setViewMonth(viewMonth - 1);
                    }
                  }}
                >
                  <Text className="text-emerald-400 text-lg font-bold px-2">◀</Text>
                </TouchableOpacity>
                <Text className="text-white font-semibold text-base">
                  {monthsList[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear(viewYear + 1);
                    } else {
                      setViewMonth(viewMonth + 1);
                    }
                  }}
                >
                  <Text className="text-emerald-400 text-lg font-bold px-2">▶</Text>
                </TouchableOpacity>
              </View>

              {/* Weekdays */}
              <View className="flex-row justify-between text-center mb-1">
                {weekDays.map((wd, idx) => (
                  <Text key={idx} className="text-zinc-500 font-bold w-9 text-center text-xs">
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View className="flex-row flex-wrap justify-between gap-y-2">
                {daysArray.map((day, idx) => {
                  const isSelected =
                    day !== null &&
                    txDate.getDate() === day &&
                    txDate.getMonth() === viewMonth &&
                    txDate.getFullYear() === viewYear;

                  return (
                    <TouchableOpacity
                      key={idx}
                      disabled={day === null}
                      className={`w-9 h-9 items-center justify-center rounded-xl ${
                        day === null
                          ? "opacity-0"
                          : isSelected
                            ? txType === "income"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                            : "bg-white/[0.03]"
                      }`}
                      onPress={() => {
                        if (day !== null) {
                          setTxDate(new Date(viewYear, viewMonth, day));
                        }
                      }}
                    >
                      <Text
                        className={`text-sm ${
                          day === null
                            ? ""
                            : isSelected
                              ? "text-white font-bold"
                              : "text-zinc-300"
                        }`}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                className="bg-white/[0.06] border border-white/[0.08] rounded-xl py-3 items-center mt-2"
                onPress={() => setShowDatePicker(false)}
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
