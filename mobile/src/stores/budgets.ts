import { create } from "zustand";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export interface Budget {
  _id: string;
  userId: string;
  categoryId: string | { _id: string; name: string; icon?: string; color?: string };
  amountMinor: number;
  currency: string;
  period: "monthly" | "weekly" | "yearly";
  month: number;
  year: number;
  alertThreshold?: number;
}

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  fetchBudgets: (month?: number, year?: number) => Promise<void>;
  addBudget: (data: {
    categoryId: string;
    amountMinor: number;
    currency?: string;
    period?: "monthly" | "weekly" | "yearly";
    month: number;
    year: number;
    alertThreshold?: number;
  }) => Promise<void>;
  updateBudget: (id: string, data: {
    amountMinor?: number;
    alertThreshold?: number;
  }) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async (month, year) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (month !== undefined) params.month = String(month);
      if (year !== undefined) params.year = String(year);
      const res = await apiGet<Budget[]>("/budgets", params);
      if (res.data) {
        set({ budgets: res.data, isLoading: false });
      } else if (res.error) {
        set({ error: res.error.message, isLoading: false });
      }
    } catch (err) {
      set({
        error: (err as Error).message || "Failed to fetch budgets",
        isLoading: false,
      });
    }
  },

  addBudget: async (data) => {
    set({ error: null });
    try {
      const res = await apiPost<Budget>("/budgets", data);
      if (res.data) {
        set({ budgets: [...get().budgets, res.data] });
      } else if (res.error) {
        set({ error: res.error.message });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to add budget" });
    }
  },

  updateBudget: async (id, data) => {
    set({ error: null });
    try {
      const res = await apiPatch<Budget>("/budgets", { id, ...data });
      if (res.data) {
        set({
          budgets: get().budgets.map((b) =>
            b._id === id ? { ...b, ...res.data } : b
          ),
        });
      } else if (res.error) {
        set({ error: res.error.message });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to update budget" });
    }
  },

  removeBudget: async (id) => {
    set({ error: null });
    try {
      const res = await apiDelete<{ deleted: boolean }>("/budgets", { id });
      if (res.data?.deleted) {
        set({ budgets: get().budgets.filter((b) => b._id !== id) });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to remove budget" });
    }
  },
}));
