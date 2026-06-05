import { create } from "zustand";
import { apiGet } from "@/lib/api";
import { getCurrentMonthYear } from "@/lib/utils";

export interface DashboardSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    total: number;
    count: number;
  }>;
  budgetStatus: Array<{
    budgetId: string;
    categoryId: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentage: number;
    alertThreshold: number;
    isOverBudget: boolean;
    isNearThreshold: boolean;
  }>;
}

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchSummary: (month?: number, year?: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  fetchSummary: async (month, year) => {
    const { month: m, year: y } = getCurrentMonthYear();
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {
        month: String(month ?? m),
        year: String(year ?? y),
      };
      const res = await apiGet<DashboardSummary>("/dashboard/summary", params);
      if (res.data) {
        set({ summary: res.data, isLoading: false });
      } else if (res.error) {
        set({ error: res.error.message, isLoading: false });
      }
    } catch (err) {
      set({
        error: (err as Error).message || "Failed to load dashboard",
        isLoading: false,
      });
    }
  },
}));
