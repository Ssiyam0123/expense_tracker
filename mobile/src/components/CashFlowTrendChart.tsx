import React from "react";
import { View, useWindowDimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

interface CashFlowTrendChartProps {
  data: Array<{ label: string; income: number; expense: number }>;
  height?: number;
  incomeColor?: string;
  expenseColor?: string;
}

/**
 * Simple SVG area chart showing income and expense trends over time.
 */
export function CashFlowTrendChart({
  data,
  height = 160,
  incomeColor = "#22c55e",
  expenseColor = "#ef4444",
}: CashFlowTrendChartProps) {
  const { width: screenWidth } = useWindowDimensions();

  if (data.length === 0) {
    return (
      <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 items-center justify-center">
        <CashFlowTrendSVG data={[]} height={height} width={screenWidth - 72} />
      </View>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1
  );

  return (
    <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <CashFlowTrendSVG
        data={data}
        width={screenWidth - 72}
        height={height}
        maxValue={maxValue}
        incomeColor={incomeColor}
        expenseColor={expenseColor}
      />
    </View>
  );
}

function CashFlowTrendSVG({
  data,
  width,
  height,
  maxValue = 1,
  incomeColor = "#22c55e",
  expenseColor = "#ef4444",
}: {
  data: Array<{ income: number; expense: number }>;
  width: number;
  height: number;
  maxValue?: number;
  incomeColor?: string;
  expenseColor?: string;
}) {
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (data.length === 0) return null;

  const stepX = chartWidth / Math.max(data.length - 1, 1);

  const getY = (value: number) =>
    chartHeight - (value / maxValue) * chartHeight + padding;

  const incomePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${padding + i * stepX} ${getY(d.income)}`)
    .join(" ");

  const expensePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${padding + i * stepX} ${getY(d.expense)}`)
    .join(" ");

  // Close path for area fill
  const incomeArea = `${incomePath} L ${padding + (data.length - 1) * stepX} ${chartHeight + padding} L ${padding} ${chartHeight + padding} Z`;
  const expenseArea = `${expensePath} L ${padding + (data.length - 1) * stepX} ${chartHeight + padding} L ${padding} ${chartHeight + padding} Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={incomeColor} stopOpacity={0.3} />
          <Stop offset="1" stopColor={incomeColor} stopOpacity={0.02} />
        </LinearGradient>
        <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={expenseColor} stopOpacity={0.3} />
          <Stop offset="1" stopColor={expenseColor} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>

      {/* Expense area */}
      <Path d={expenseArea} fill="url(#expenseGrad)" />
      {/* Expense line */}
      <Path d={expensePath} stroke={expenseColor} strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Income area */}
      <Path d={incomeArea} fill="url(#incomeGrad)" />
      {/* Income line */}
      <Path d={incomePath} stroke={incomeColor} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
