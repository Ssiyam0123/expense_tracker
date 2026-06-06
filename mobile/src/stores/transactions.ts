import { create } from "zustand";
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getDeviceId,
} from "@/lib/api";
import { generateLocalId, getCurrentMonthYear } from "@/lib/utils";
import { getOfflineDB } from "@/db/schema";
import { triggerSync } from "@/db/sync";

export interface Transaction {
  _id?: string;
  localId: string;
  amountMinor: number;
  currency: string;
  type: "income" | "expense";
  categoryId: string | { _id: string; name: string; icon?: string; color?: string; type?: string };
  paymentMethodId: string | { _id: string; name: string; icon?: string };
  timestamp: string;
  note?: string;
  tags?: string[];
  syncStatus?: "synced" | "pending_create" | "pending_update" | "pending_delete";
  version?: number;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  fetchTransactions: (params?: Record<string, string>) => Promise<void>;
  addTransaction: (data: {
    amountMinor: number;
    currency?: string;
    type: "income" | "expense";
    categoryId: string;
    paymentMethodId: string;
    timestamp?: string;
    note?: string;
    tags?: string[];
  }) => Promise<Transaction | null>;
  updateTransaction: (
    localId: string,
    data: Partial<{
      amountMinor: number;
      type: "income" | "expense";
      categoryId: string;
      paymentMethodId: string;
      note: string;
      tags: string[];
      timestamp: string;
    }>
  ) => Promise<void>;
  deleteTransaction: (localId: string) => Promise<void>;
  syncOfflineTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },

  fetchTransactions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiGet<Transaction[]>("/transactions", params);
      if (res.data) {
        set({
          transactions: res.data as Transaction[],
          pagination: {
            page: (res.meta?.page as number) || 1,
            limit: (res.meta?.limit as number) || 20,
            total: (res.meta?.total as number) || 0,
            totalPages: (res.meta?.totalPages as number) || 0,
          },
          isLoading: false,
        });
      } else if (res.error) {
        set({ error: res.error.message, isLoading: false });
      }
    } catch (err) {
      // Try loading from local DB when offline
      try {
        const db = await getOfflineDB();
        const localTxns = await db.getAllAsync<Transaction>(
          `SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY timestamp DESC`
        );
        set({
          transactions: localTxns,
          isLoading: false,
          error: "Offline mode - showing local data",
        });
      } catch {
        set({
          error: (err as Error).message || "Failed to load transactions",
          isLoading: false,
        });
      }
    }
  },

  addTransaction: async (data) => {
    const localId = generateLocalId();
    const deviceId = await getDeviceId();
    const timestamp = data.timestamp || new Date().toISOString();
    const transaction: Transaction = {
      localId,
      amountMinor: data.amountMinor,
      currency: data.currency || "BDT",
      type: data.type,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
      timestamp,
      note: data.note,
      tags: data.tags || [],
      syncStatus: "pending_create",
      version: 1,
    };

    // Save locally first (offline-first)
    try {
      const db = await getOfflineDB();
      await db.runAsync(
        `INSERT OR REPLACE INTO transactions 
         (id, amount_minor, currency, type, category_id, payment_method_id, 
          timestamp, note, tags, sync_status, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          data.amountMinor,
          data.currency || "BDT",
          data.type,
          data.categoryId,
          data.paymentMethodId,
          timestamp,
          data.note || null,
          JSON.stringify(data.tags || []),
          "pending_create",
          1,
        ]
      );
    } catch {
      // Local save failed, continue
    }

    // Optimistic UI update
    set({ transactions: [transaction, ...get().transactions] });

    // Trigger background sync
    triggerSync().catch(() => {});

    // Also try server (non-blocking)
    apiPost("/transactions", {
      ...data,
      localId,
      sourceDeviceId: deviceId,
      timestamp,
    }).catch(() => {});

    return transaction;
  },

  updateTransaction: async (localId, data) => {
    set({ error: null });
    const currentTxns = get().transactions;

    // Optimistic update local state
    set({
      transactions: currentTxns.map((t) =>
        t.localId === localId
          ? { ...t, ...data, syncStatus: "pending_update" as const }
          : t
      ),
    });

    // Update local DB
    try {
      const db = await getOfflineDB();
      if (data.amountMinor !== undefined) {
        await db.runAsync(
          `UPDATE transactions SET amount_minor = ?, sync_status = 'pending_update' WHERE id = ?`,
          [data.amountMinor, localId]
        );
      }
      if (data.type !== undefined) {
        await db.runAsync(
          `UPDATE transactions SET type = ?, sync_status = 'pending_update' WHERE id = ?`,
          [data.type, localId]
        );
      }
      if (data.categoryId !== undefined) {
        await db.runAsync(
          `UPDATE transactions SET category_id = ?, sync_status = 'pending_update' WHERE id = ?`,
          [data.categoryId, localId]
        );
      }
      if (data.paymentMethodId !== undefined) {
        await db.runAsync(
          `UPDATE transactions SET payment_method_id = ?, sync_status = 'pending_update' WHERE id = ?`,
          [data.paymentMethodId, localId]
        );
      }
      if (data.timestamp !== undefined) {
        await db.runAsync(
          `UPDATE transactions SET timestamp = ?, sync_status = 'pending_update' WHERE id = ?`,
          [data.timestamp, localId]
        );
      }
      if (data.note !== undefined) {
        await db.runAsync(
          `UPDATE transactions SET note = ?, sync_status = 'pending_update' WHERE id = ?`,
          [data.note, localId]
        );
      }
    } catch (err) {
      // continue
    }

    triggerSync().catch(() => {});
  },

  deleteTransaction: async (localId) => {
    set({ error: null });

    // Optimistic removal
    set({
      transactions: get().transactions.filter((t) => t.localId !== localId),
    });

    // Mark as deleted in local DB
    try {
      const db = await getOfflineDB();
      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE transactions SET sync_status = 'pending_delete', deleted_at = ? WHERE id = ?`,
        [now, localId]
      );
    } catch {
      // continue
    }

    triggerSync().catch(() => {});
  },

  syncOfflineTransactions: async () => {
    const { isSyncing } = get();
    if (isSyncing) return;
    set({ isSyncing: true });

    try {
      const db = await getOfflineDB();
      const pendingRows = await db.getAllAsync<{
        id: string;
        amount_minor: number;
        currency: string;
        type: string;
        category_id: string;
        payment_method_id: string;
        timestamp: string;
        note: string | null;
        tags: string;
        sync_status: string;
        version: number;
        deleted_at: string | null;
      }>(
        `SELECT * FROM transactions WHERE sync_status != 'synced' ORDER BY timestamp ASC`
      );

      if (pendingRows.length === 0) {
        set({ isSyncing: false });
        return;
      }

      const deviceId = await getDeviceId();
      const payload = {
        transactions: pendingRows.map((row) => ({
          localId: row.id,
          sourceDeviceId: deviceId,
          amountMinor: row.amount_minor,
          currency: row.currency,
          type: row.type,
          categoryId: row.category_id,
          paymentMethodId: row.payment_method_id,
          timestamp: row.timestamp,
          note: row.note || null,
          tags: JSON.parse(row.tags || "[]"),
          version: row.version,
          deletedAt: row.deleted_at || null,
          idempotencyKey: generateLocalId(),
        })),
      };

      const res = await apiPost<
        Array<{ localId: string; status: string; serverId?: string }>
      >("/transactions/sync", payload);

      if (res.data) {
        for (const result of res.data) {
          if (result.status === "error" || result.status === "conflict") {
            // Keep in local DB for retry
            continue;
          }

          if (result.status === "deleted") {
            await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [
              result.localId,
            ]);
          } else {
            await db.runAsync(
              `UPDATE transactions SET sync_status = 'synced', server_id = ? WHERE id = ?`,
              [result.serverId || null, result.localId]
            );
          }
        }
      }
    } catch {
      // Will retry later
    } finally {
      set({ isSyncing: false });
    }
  },
}));
