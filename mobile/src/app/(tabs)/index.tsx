import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { useDashboardStore } from "@/stores/dashboard";
import { useCategoryStore } from "@/stores/categories";
import { useTransactionStore } from "@/stores/transactions";
import { formatCurrency, getCurrentMonthYear, fromMinorUnits } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardScreen() {
  const router = useRouter();
  const { summary, isLoading, error, fetchSummary } = useDashboardStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { signOut } = useAuth();

  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    fetchSummary();
    fetchCategories();
    fetchTransactions({ limit: "100" });
  }, []);

  const handleRefresh = () => {
    fetchSummary(month, year);
    fetchCategories();
    fetchTransactions({ limit: "100" });
  };

  // ----------------------------------------------------
  // Donut Chart Calculations (Web Sync)
  // ----------------------------------------------------
  const donutData = useMemo(() => {
    if (!summary || !summary.categoryBreakdown) return [];
    const total = summary.categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // ~314.16

    let accumulatedPercentage = 0;
    return summary.categoryBreakdown.map((cat) => {
      const percentage = total > 0 ? (cat.total / total) * 100 : 0;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;
      const rotation = (accumulatedPercentage * 360) / 100;
      accumulatedPercentage += percentage;

      return {
        ...cat,
        percentage: Math.round(percentage),
        strokeDashoffset,
        rotation,
      };
    });
  }, [summary]);

  // ----------------------------------------------------
  // Area Chart Calculations (Web Sync)
  // ----------------------------------------------------
  const areaChartData = useMemo(() => {
    const dailyData: { [key: number]: { income: number; expense: number } } = {};
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const limitDay = daysInMonth;

    // Initialize all days
    for (let i = 1; i <= limitDay; i++) {
      dailyData[i] = { income: 0, expense: 0 };
    }

    // Accumulate daily totals
    const safeTx = Array.isArray(transactions) ? transactions : [];
    safeTx.forEach((tx) => {
      const date = new Date(tx.timestamp);
      if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (dailyData[day]) {
          const val = fromMinorUnits(tx.amountMinor);
          const safeVal = isNaN(val) || val === null || val === undefined ? 0 : val;
          if (tx.type === "income") {
            dailyData[day].income += safeVal;
          } else {
            dailyData[day].expense += safeVal;
          }
        }
      }
    });

    const points = Object.keys(dailyData).map((dayStr) => {
      const day = parseInt(dayStr, 10);
      return {
        day,
        income: dailyData[day].income,
        expense: dailyData[day].expense,
      };
    });

    // Chart dimensions (Adapted for mobile screens)
    const screenWidth = Dimensions.get("window").width - 40; // padding horizontal
    const width = screenWidth > 0 ? screenWidth : 350;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;

    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const maxVal = Math.max(
      ...points.map((p) => Math.max(isNaN(p.income) ? 0 : p.income, isNaN(p.expense) ? 0 : p.expense)),
      1000 // default max
    );
    const safeMaxVal = isNaN(maxVal) || maxVal <= 0 ? 1000 : maxVal;

    // Compute coordinates
    const coordinates = points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * chartW;
      const incomeVal = isNaN(p.income) ? 0 : p.income;
      const expenseVal = isNaN(p.expense) ? 0 : p.expense;
      const yIncome = height - paddingY - (incomeVal / safeMaxVal) * chartH;
      const yExpense = height - paddingY - (expenseVal / safeMaxVal) * chartH;
      return {
        day: p.day,
        income: p.income,
        expense: p.expense,
        x,
        yIncome,
        yExpense,
      };
    });

    // Paths
    let incomePath = "";
    let expensePath = "";
    let incomeAreaPath = "";
    let expenseAreaPath = "";

    if (coordinates.length > 0) {
      incomePath = `M ${coordinates[0].x} ${coordinates[0].yIncome}`;
      incomeAreaPath = `M ${coordinates[0].x} ${height - paddingY}`;
      coordinates.forEach((c) => {
        incomePath += ` L ${c.x} ${c.yIncome}`;
        incomeAreaPath += ` L ${c.x} ${c.yIncome}`;
      });
      incomeAreaPath += ` L ${coordinates[coordinates.length - 1].x} ${height - paddingY} Z`;

      expensePath = `M ${coordinates[0].x} ${coordinates[0].yExpense}`;
      expenseAreaPath = `M ${coordinates[0].x} ${height - paddingY}`;
      coordinates.forEach((c) => {
        expensePath += ` L ${c.x} ${c.yExpense}`;
        expenseAreaPath += ` L ${c.x} ${c.yExpense}`;
      });
      expenseAreaPath += ` L ${coordinates[coordinates.length - 1].x} ${height - paddingY} Z`;
    }

    return {
      coordinates,
      incomePath,
      expensePath,
      incomeAreaPath,
      expenseAreaPath,
      width,
      height,
      paddingX,
      paddingY,
      maxVal,
    };
  }, [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} className="flex-1 bg-black" edges={["top", "left", "right"]}>
      {/* Neon glow backgrounds */}
      <View className="absolute top-[-40] left-[-40] w-[200px] h-[200px] bg-emerald-500 rounded-full opacity-10" />
      <View className="absolute bottom-[100] right-[-60] w-[220px] h-[220px] bg-emerald-600 rounded-full opacity-8" />

      <ScrollView
        className="flex-1 px-4 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#10B981"
          />
        }
        contentContainerClassName="pb-28"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center gap-3">
            <Image
              source={require("../../../assets/images/logo.png")}
              style={{ width: 40, height: 40, borderRadius: 8 }}
            />
            <View>
              <Text className="text-zinc-400 text-xs font-semibold tracking-wider">
                {MONTH_NAMES[month - 1]} {year}
              </Text>
              <Text className="text-white text-2xl font-bold tracking-tight">Dashboard</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={signOut}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2"
          >
            <Text className="text-zinc-400 text-xs font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-xs">{error}</Text>
          </View>
        )}

        {summary ? (
          <>
            {/* Cash Flow Summary Cards Grid */}
            <View className="flex-row gap-3 mb-4">
              {/* Income */}
              <View className="flex-1 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <View className="absolute top-0 left-0 h-[2px] w-full bg-emerald-500/30" />
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-zinc-400 text-[10px] uppercase font-semibold">Income</Text>
                  <Text className="text-xs">📥</Text>
                </View>
                <Text className="text-emerald-400 text-lg font-bold tracking-tight">
                  +{formatCurrency(summary.totalIncome)}
                </Text>
              </View>

              {/* Expense */}
              <View className="flex-1 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <View className="absolute top-0 left-0 h-[2px] w-full bg-red-500/30" />
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-zinc-400 text-[10px] uppercase font-semibold">Expenses</Text>
                  <Text className="text-xs">📤</Text>
                </View>
                <Text className="text-red-400 text-lg font-bold tracking-tight">
                  -{formatCurrency(summary.totalExpense)}
                </Text>
              </View>
            </View>

            {/* Net Balance Card */}
            <View className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4.5 mb-6">
              <View className="absolute top-0 left-0 h-[2px] w-full bg-emerald-500/20" />
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-zinc-400 text-[10px] uppercase font-semibold">Net Balance</Text>
                <Text className="text-xs">⚖️</Text>
              </View>
              <Text className={`text-2xl font-bold tracking-tight ${
                summary.balance >= 0 ? "text-white" : "text-red-400"
              }`}>
                {formatCurrency(summary.balance)}
              </Text>
            </View>

            {/* Quick Log Buttons */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                className="flex-1 bg-emerald-500 rounded-xl py-3.5 items-center"
                onPress={() => router.push("/modal/add-transaction?type=income")}
              >
                <Text className="text-white text-sm font-semibold">+ Add Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-3.5 items-center"
                onPress={() => router.push("/modal/add-transaction?type=expense")}
              >
                <Text className="text-white text-sm font-semibold">- Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* Cash Flow Trend (SVG Area Chart) */}
            <View className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 mb-6 shadow-inner">
              <View className="mb-4">
                <Text className="text-sm font-bold text-white tracking-tight">Cash Flow Trend</Text>
                <Text className="text-[10px] text-zinc-400">Daily income & expense flow</Text>
              </View>

              <View className="w-full justify-center items-center">
                <Svg
                  width={areaChartData.width}
                  height={areaChartData.height}
                  viewBox={`0 0 ${areaChartData.width} ${areaChartData.height}`}
                >
                  <Defs>
                    <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                    </LinearGradient>
                    <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#EF4444" stopOpacity="0.00" />
                    </LinearGradient>
                  </Defs>

                  {/* Gridlines */}
                  <Line
                    x1={areaChartData.paddingX}
                    y1={areaChartData.paddingY}
                    x2={areaChartData.width - areaChartData.paddingX}
                    y2={areaChartData.paddingY}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4"
                  />
                  <Line
                    x1={areaChartData.paddingX}
                    y1={areaChartData.height / 2}
                    x2={areaChartData.width - areaChartData.paddingX}
                    y2={areaChartData.height / 2}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4"
                  />
                  <Line
                    x1={areaChartData.paddingX}
                    y1={areaChartData.height - areaChartData.paddingY}
                    x2={areaChartData.width - areaChartData.paddingX}
                    y2={areaChartData.height - areaChartData.paddingY}
                    stroke="rgba(255,255,255,0.1)"
                  />

                  {/* Chart Paths */}
                  {areaChartData.incomePath ? (
                    <>
                      <Path d={areaChartData.incomeAreaPath} fill="url(#incomeGrad)" />
                      <Path
                        d={areaChartData.incomePath}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                    </>
                  ) : null}

                  {areaChartData.expensePath ? (
                    <>
                      <Path d={areaChartData.expenseAreaPath} fill="url(#expenseGrad)" />
                      <Path
                        d={areaChartData.expensePath}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                      />
                    </>
                  ) : null}

                  {/* Axis labels */}
                  <SvgText
                    x={areaChartData.paddingX}
                    y={areaChartData.height - 8}
                    fill="rgba(255,255,255,0.4)"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    1st
                  </SvgText>
                  <SvgText
                    x={areaChartData.width / 2}
                    y={areaChartData.height - 8}
                    fill="rgba(255,255,255,0.4)"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    Mid
                  </SvgText>
                  <SvgText
                    x={areaChartData.width - areaChartData.paddingX}
                    y={areaChartData.height - 8}
                    fill="rgba(255,255,255,0.4)"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    End
                  </SvgText>
                </Svg>
              </View>
            </View>

            {/* Category Breakdown (SVG Donut Chart) */}
            <View className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 mb-6">
              <Text className="text-sm font-bold text-white tracking-tight mb-0.5">
                Category Breakdown
              </Text>
              <Text className="text-[10px] text-zinc-400 mb-4">Expense split for this month</Text>

              {donutData.length > 0 ? (
                <View className="flex-row items-center justify-around gap-4">
                  {/* SVG Donut */}
                  <View className="relative h-28 w-28 shrink-0 justify-center items-center">
                    <Svg width="110" height="110" viewBox="0 0 120 120">
                      {/* Base Circle */}
                      <Circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="10"
                      />
                      {donutData.map((cat, i) => (
                        <Circle
                           key={cat.categoryId + "_" + i}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={cat.categoryColor || "#6366F1"}
                          strokeWidth="10"
                          strokeDasharray="314.16"
                          strokeDashoffset={cat.strokeDashoffset}
                          transform={`rotate(${cat.rotation - 90} 60 60)`}
                        />
                      ))}
                    </Svg>
                    {/* Centered balance text */}
                    <View className="absolute flex-col items-center justify-center">
                      <Text className="text-[8px] uppercase tracking-wider text-zinc-500">Total</Text>
                      <Text className="text-[11px] font-bold text-white">
                        ৳{fromMinorUnits(summary.totalExpense).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Legends Sidebar list */}
                  <View className="flex-1 space-y-2 max-h-[120px] overflow-y-auto pl-2">
                    {donutData.map((cat) => (
                      <View key={cat.categoryId} className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
                          <View
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.categoryColor || "#6366F1" }}
                          />
                          <Text className="text-zinc-300 text-xs truncate">
                            {cat.categoryIcon} {cat.categoryName}
                          </Text>
                        </View>
                        <Text className="text-zinc-400 font-mono text-[9px] pl-2">
                          {cat.percentage}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="flex h-24 items-center justify-center">
                  <Text className="text-xs text-zinc-500 italic">No expenses recorded yet</Text>
                </View>
              )}
            </View>

            {/* Budget Progress Bars */}
            {summary.budgetStatus.length > 0 && (
              <View className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 mb-6">
                <Text className="text-sm font-bold text-white tracking-tight mb-0.5">
                  Active Budget Status
                </Text>
                <Text className="text-[10px] text-zinc-400 mb-4">Spend vs. budget limit</Text>

                <View className="gap-3">
                  {summary.budgetStatus.map((b) => {
                    const cat = categories.find((c) => c._id === b.categoryId);
                    const displayName = cat ? `${cat.icon || "📌"} ${cat.name}` : b.categoryName || "Unknown";
                    return (
                      <View
                        key={b.budgetId}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="text-xs font-semibold text-slate-200">
                            {displayName}
                          </Text>
                        <View className={`rounded-full px-2 py-0.5 ${
                          b.isOverBudget
                            ? "bg-red-500/10"
                            : b.isNearThreshold
                              ? "bg-yellow-500/10"
                              : "bg-emerald-500/10"
                        }`}>
                          <Text className={`text-[9px] font-bold ${
                            b.isOverBudget
                              ? "text-red-400"
                              : b.isNearThreshold
                                ? "text-yellow-400"
                                : "text-emerald-400"
                          }`}>
                            {b.percentage}%
                          </Text>
                        </View>
                      </View>

                      <View className="h-1.5 overflow-hidden rounded-full bg-white/[0.06] mb-2">
                        <View
                          className={`h-full rounded-full ${
                            b.isOverBudget
                              ? "bg-red-500"
                              : b.isNearThreshold
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        />
                      </View>

                      <View className="flex-row justify-between font-mono text-[9px] text-zinc-500">
                        <Text className="text-zinc-500">৳{fromMinorUnits(b.spentAmount).toLocaleString()} spent</Text>
                        <Text className="text-zinc-500">Limit ৳{fromMinorUnits(b.budgetAmount).toLocaleString()}</Text>
                      </View>
                    </View>
                  );
                })}
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
