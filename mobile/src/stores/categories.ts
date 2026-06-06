import { create } from "zustand";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export interface Category {
  _id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  type: "income" | "expense";
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  addCategory: (data: {
    name: string;
    icon?: string;
    color?: string;
    type?: "income" | "expense";
  }) => Promise<void>;
  updateCategory: (id: string, data: {
    name?: string;
    icon?: string;
    color?: string;
    type?: "income" | "expense";
  }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiGet<Category[]>("/categories");
      if (res.data) {
        set({ categories: res.data, isLoading: false });
      } else if (res.error) {
        set({ error: res.error.message, isLoading: false });
      }
    } catch (err) {
      set({
        error: (err as Error).message || "Failed to fetch categories",
        isLoading: false,
      });
    }
  },

  addCategory: async (data) => {
    set({ error: null });
    try {
      const res = await apiPost<Category>("/categories", data);
      if (res.data) {
        set({ categories: [...get().categories, res.data] });
      } else if (res.error) {
        set({ error: res.error.message });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to add category" });
    }
  },

  updateCategory: async (id, data) => {
    set({ error: null });
    try {
      const res = await apiPatch<Category>("/categories", { id, ...data });
      if (res.data) {
        set({
          categories: get().categories.map((c) =>
            c._id === id ? { ...c, ...res.data } : c
          ),
        });
      } else if (res.error) {
        set({ error: res.error.message });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to update category" });
    }
  },

  removeCategory: async (id) => {
    set({ error: null });
    try {
      const res = await apiDelete<{ deleted: boolean }>("/categories", { id });
      if (res.data?.deleted) {
        set({ categories: get().categories.filter((c) => c._id !== id) });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to remove category" });
    }
  },
}));
