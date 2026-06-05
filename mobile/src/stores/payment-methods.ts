import { create } from "zustand";
import { apiGet, apiPost } from "@/lib/api";

export interface PaymentMethod {
  _id: string;
  userId: string;
  name: string;
  icon?: string;
}

interface PaymentMethodState {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;

  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (data: {
    name: string;
    icon?: string;
  }) => Promise<void>;
}

export const usePaymentMethodStore = create<PaymentMethodState>((set, get) => ({
  paymentMethods: [],
  isLoading: false,
  error: null,

  fetchPaymentMethods: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiGet<PaymentMethod[]>("/payment-methods");
      if (res.data) {
        set({ paymentMethods: res.data, isLoading: false });
      } else if (res.error) {
        set({ error: res.error.message, isLoading: false });
      }
    } catch (err) {
      set({
        error: (err as Error).message || "Failed to fetch payment methods",
        isLoading: false,
      });
    }
  },

  addPaymentMethod: async (data) => {
    set({ error: null });
    try {
      const res = await apiPost<PaymentMethod>("/payment-methods", data);
      if (res.data) {
        set({ paymentMethods: [...get().paymentMethods, res.data] });
      } else if (res.error) {
        set({ error: res.error.message });
      }
    } catch (err) {
      set({ error: (err as Error).message || "Failed to add payment method" });
    }
  },
}));
