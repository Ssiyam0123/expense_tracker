"use client";

import { useState, useMemo } from "react";
import { fromMinorUnits } from "@/lib/utils";

interface CategoryBreakdown {
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  total: number;
  count: number;
}

interface BudgetStatus {
  budgetId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  alertThreshold?: number;
  isOverBudget: boolean;
  isNearThreshold: boolean;
}

interface TransactionRecord {
  _id: string;
  amountMinor: number;
  currency: string;
  type: "income" | "expense";
  note?: string;
  timestamp: string;
  categoryId?: { _id: string; name: string; icon?: string; color?: string };
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
  budgetStatus: BudgetStatus[];
}

interface Props {
  summary: Summary;
  transactions: TransactionRecord[];
}

export function DashboardSummary({ summary, transactions }: Props) {
  const { totalIncome, totalExpense, balance, categoryBreakdown, budgetStatus } =
    summary;

  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // ----------------------------------------------------
  // Donut Chart Calculations
  // ----------------------------------------------------
  const donutData = useMemo(() => {
    const total = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // ~314.16

    let accumulatedPercentage = 0;
    return categoryBreakdown.map((cat) => {
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
  }, [categoryBreakdown]);

  // ----------------------------------------------------
  // Daily Trend / Area Chart Calculations
  // ----------------------------------------------------
  const areaChartData = useMemo(() => {
    const dailyData: { [key: number]: { income: number; expense: number } } = {};
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const limitDay = daysInMonth;

    // Initialize all days in current month
    for (let i = 1; i <= limitDay; i++) {
      dailyData[i] = { income: 0, expense: 0 };
    }

    // Accumulate daily totals
    transactions.forEach((tx) => {
      const date = new Date(tx.timestamp);
      if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (dailyData[day]) {
          const val = fromMinorUnits(tx.amountMinor);
          if (tx.type === "income") {
            dailyData[day].income += val;
          } else {
            dailyData[day].expense += val;
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

    // Chart dimensions
    const width = 600;
    const height = 180;
    const paddingX = 45;
    const paddingY = 25;

    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const maxVal = Math.max(
      ...points.map((p) => Math.max(p.income, p.expense)),
      1000 // default max to avoid division by zero
    );

    // Compute coordinates
    const coordinates = points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * chartW;
      const yIncome = height - paddingY - (p.income / maxVal) * chartH;
      const yExpense = height - paddingY - (p.expense / maxVal) * chartH;
      return {
        day: p.day,
        income: p.income,
        expense: p.expense,
        x,
        yIncome,
        yExpense,
      };
    });

    // Generate path descriptions
    let incomePath = "";
    let expensePath = "";
    let incomeAreaPath = "";
    let expenseAreaPath = "";

    if (coordinates.length > 0) {
      // Income line & area
      incomePath = `M ${coordinates[0].x} ${coordinates[0].yIncome}`;
      incomeAreaPath = `M ${coordinates[0].x} ${height - paddingY}`;
      coordinates.forEach((c) => {
        incomePath += ` L ${c.x} ${c.yIncome}`;
        incomeAreaPath += ` L ${c.x} ${c.yIncome}`;
      });
      incomeAreaPath += ` L ${coordinates[coordinates.length - 1].x} ${height - paddingY} Z`;

      // Expense line & area
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

  const activeHoverData = useMemo(() => {
    if (hoveredDay === null) return null;
    return areaChartData.coordinates.find((c) => c.day === hoveredDay) || null;
  }, [hoveredDay, areaChartData]);

  return (
    <div className="relative space-y-6">
      {/* Background neon glow blobs for glassmorphism aesthetic */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />

      {/* Main summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Income Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:shadow-accent/5">
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-income/40 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Income
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-income/10 text-income text-sm">
              📥
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            ৳{fromMinorUnits(totalIncome).toLocaleString()}
          </p>
        </div>

        {/* Expense Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:shadow-expense/5">
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-expense/40 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Expenses
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-expense/10 text-expense text-sm">
              📤
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            ৳{fromMinorUnits(totalExpense).toLocaleString()}
          </p>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:shadow-indigo-500/5">
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Balance
            </p>
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
              balance >= 0 ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
            }`}>
              ⚖️
            </div>
          </div>
          <p className={`mt-3 text-2xl font-bold tracking-tight ${
            balance >= 0 ? "text-white" : "text-expense"
          }`}>
            ৳{fromMinorUnits(balance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts section: Flow Chart & Donut Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cash Flow Area Chart */}
        <div className="lg:col-span-2 relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Cash Flow Trend
              </h3>
              <p className="text-xs text-slate-400">Daily income & expense flow</p>
            </div>
            {/* Interactive tooltip */}
            <div className="h-6 text-xs text-slate-300">
              {activeHoverData ? (
                <span className="font-mono bg-white/5 rounded px-2.5 py-1 flex items-center gap-3">
                  <span>Day {activeHoverData.day}</span>
                  <span className="text-income">+{activeHoverData.income}</span>
                  <span className="text-expense">-{activeHoverData.expense}</span>
                </span>
              ) : (
                <span className="text-slate-400 italic">Hover chart for details</span>
              )}
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${areaChartData.width} ${areaChartData.height}`}
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line
                x1={areaChartData.paddingX}
                y1={areaChartData.paddingY}
                x2={areaChartData.width - areaChartData.paddingX}
                y2={areaChartData.paddingY}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4"
              />
              <line
                x1={areaChartData.paddingX}
                y1={areaChartData.height / 2}
                x2={areaChartData.width - areaChartData.paddingX}
                y2={areaChartData.height / 2}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4"
              />
              <line
                x1={areaChartData.paddingX}
                y1={areaChartData.height - areaChartData.paddingY}
                x2={areaChartData.width - areaChartData.paddingX}
                y2={areaChartData.height - areaChartData.paddingY}
                stroke="rgba(255,255,255,0.1)"
              />

              {/* Chart Paths */}
              {areaChartData.incomePath && (
                <>
                  <path
                    d={areaChartData.incomeAreaPath}
                    fill="url(#incomeGrad)"
                  />
                  <path
                    d={areaChartData.incomePath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}

              {areaChartData.expensePath && (
                <>
                  <path
                    d={areaChartData.expenseAreaPath}
                    fill="url(#expenseGrad)"
                  />
                  <path
                    d={areaChartData.expensePath}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Hover highlight line */}
              {activeHoverData && (
                <line
                  x1={activeHoverData.x}
                  y1={areaChartData.paddingY}
                  x2={activeHoverData.x}
                  y2={areaChartData.height - areaChartData.paddingY}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1"
                  strokeDasharray="2"
                />
              )}

              {/* Hover highlight circles */}
              {activeHoverData && (
                <>
                  <circle
                    cx={activeHoverData.x}
                    cy={activeHoverData.yIncome}
                    r="4"
                    fill="#10B981"
                    stroke="#0a0a0a"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={activeHoverData.x}
                    cy={activeHoverData.yExpense}
                    r="4"
                    fill="#EF4444"
                    stroke="#0a0a0a"
                    strokeWidth="1.5"
                  />
                </>
              )}

              {/* X Axis Labels */}
              <text
                x={areaChartData.paddingX}
                y={areaChartData.height - 8}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="middle"
              >
                1st
              </text>
              <text
                x={areaChartData.width / 2}
                y={areaChartData.height - 8}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="middle"
              >
                Mid
              </text>
              <text
                x={areaChartData.width - areaChartData.paddingX}
                y={areaChartData.height - 8}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="middle"
              >
                End
              </text>

              {/* Y Axis Max Label */}
              <text
                x={areaChartData.paddingX - 6}
                y={areaChartData.paddingY + 3}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="end"
              >
                {Math.round(areaChartData.maxVal).toLocaleString()}
              </text>
              <text
                x={areaChartData.paddingX - 6}
                y={areaChartData.height - areaChartData.paddingY + 3}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="end"
              >
                0
              </text>

              {/* Interactive rectangles for mouse tracking */}
              {areaChartData.coordinates.map((c) => (
                <rect
                  key={c.day}
                  x={c.x - 8}
                  y={areaChartData.paddingY}
                  width="16"
                  height={areaChartData.height - areaChartData.paddingY * 2}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredDay(c.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Spending breakdown by Category (Donut Chart) */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl">
          <h3 className="mb-1 text-sm font-semibold tracking-tight text-white">
            Category Breakdown
          </h3>
          <p className="mb-4 text-xs text-slate-400">Expense split for this month</p>

          {donutData.length > 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              {/* Donut SVG */}
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  {/* Background Track Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="10"
                  />
                  {donutData.map((cat) => (
                    <circle
                      key={cat.categoryName}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={cat.categoryColor || "#6366F1"}
                      strokeWidth="10"
                      strokeDasharray="314.16"
                      strokeDashoffset={cat.strokeDashoffset}
                      style={{
                        transformOrigin: "center",
                        transform: `rotate(${cat.rotation}deg)`,
                      }}
                      className="transition-all duration-700 ease-out hover:stroke-[13px]"
                    />
                  ))}
                </svg>
                {/* Total text inside donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Total
                  </span>
                  <span className="text-xs font-bold text-white">
                    ৳{fromMinorUnits(totalExpense).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="w-full space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {donutData.map((cat) => (
                  <div
                    key={cat.categoryName}
                    className="flex items-center justify-between text-xs transition-colors hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.categoryColor || "#6366F1" }}
                      />
                      <span className="text-slate-300 font-medium truncate max-w-[80px]">
                        {cat.categoryIcon} {cat.categoryName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[10px] tabular-nums">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400 italic">
              No expenses recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Budget Progress Bars */}
      {budgetStatus.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl">
          <h3 className="mb-1 text-sm font-semibold tracking-tight text-white">
            Active Budget Status
          </h3>
          <p className="mb-4 text-xs text-slate-400">Spend vs. budget limit</p>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {budgetStatus.map((b) => {
              const pct = b.percentage;
              return (
                <div
                  key={b.budgetId}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200">
                      {b.categoryName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        b.isOverBudget
                          ? "bg-expense/15 text-expense"
                          : b.isNearThreshold
                            ? "bg-warning/15 text-warning"
                            : "bg-income/15 text-income"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.isOverBudget
                          ? "bg-expense"
                          : b.isNearThreshold
                            ? "bg-warning"
                            : "bg-income"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>৳{fromMinorUnits(b.spentAmount).toLocaleString()} spent</span>
                    <span>Limit ৳{fromMinorUnits(b.budgetAmount).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
