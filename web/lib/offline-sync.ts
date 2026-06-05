"use client";

import { generateLocalId, toMinorUnits } from "@/lib/utils";

const DB_NAME = "expense_tracker";
const DB_VERSION = 1;
const STORE_NAME = "offline_transactions";

interface OfflineTransaction {
  localId: string;
  sourceDeviceId: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  type: "income" | "expense";
  categoryId: string;
  paymentMethodId: string;
  timestamp: string;
  note?: string;
  tags?: string[];
  version: number;
  synced: boolean;
  retryCount: number;
  createdAt: string;
  deletedAt?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "localId",
        });
        store.createIndex("synced", "synced");
        store.createIndex("createdAt", "createdAt");
        store.createIndex("sourceDeviceId_localId", ["sourceDeviceId", "localId"], {
          unique: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Save a transaction offline. If a localId is not provided, one will be generated.
 */
export async function saveOfflineTransaction(data: {
  amount: number;
  currency?: string;
  type: "income" | "expense";
  categoryId: string;
  paymentMethodId: string;
  note?: string;
  tags?: string[];
  localId?: string;
  sourceDeviceId?: string;
  timestamp?: string;
}): Promise<string> {
  const db = await openDB();
  const localId = data.localId || generateLocalId();
  const sourceDeviceId = data.sourceDeviceId || "web";

  const record: OfflineTransaction = {
    localId,
    sourceDeviceId,
    idempotencyKey: generateLocalId(),
    amountMinor: toMinorUnits(data.amount),
    currency: data.currency || "BDT",
    type: data.type,
    categoryId: data.categoryId,
    paymentMethodId: data.paymentMethodId,
    timestamp: data.timestamp || new Date().toISOString(),
    note: data.note,
    tags: data.tags,
    version: 1,
    synced: false,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(localId);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      // Trigger background sync
      attemptSync().catch(console.error);
    };
  });
}

/**
 * Get all unsynced transactions from local storage.
 */
export async function getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("synced");
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Attempt to sync unsynced offline transactions to the server.
 * Uses exponential backoff for retries.
 */
export async function attemptSync(): Promise<void> {
  try {
    const unsynced = await getUnsyncedTransactions();
    if (unsynced.length === 0) return;

    // Filter out transactions that are waiting for backoff
    const now = Date.now();
    const ready = unsynced.filter((t) => {
      if (t.retryCount === 0) return true;
      const backoff = Math.min(Math.pow(2, t.retryCount) * 1000, 60000);
      const lastTry = new Date(t.createdAt).getTime();
      return now - lastTry >= backoff;
    });

    if (ready.length === 0) return;

    const payload = {
      transactions: ready.map((t) => ({
        localId: t.localId,
        sourceDeviceId: t.sourceDeviceId,
        amountMinor: t.amountMinor,
        currency: t.currency,
        type: t.type,
        categoryId: t.categoryId,
        paymentMethodId: t.paymentMethodId,
        timestamp: t.timestamp,
        note: t.note || null,
        tags: t.tags || [],
        version: t.version,
        deletedAt: t.deletedAt || null,
        idempotencyKey: t.idempotencyKey,
      })),
    };

    const res = await fetch("/api/v1/transactions/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const result = await res.json();
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      // Mark synced or remove
      for (const t of ready) {
        const isSuccess = result.data?.some(
          (r: { localId: string; status: string }) =>
            r.localId === t.localId && r.status !== "error"
        );

        if (isSuccess) {
          store.delete(t.localId);
        } else {
          store.put({ ...t, retryCount: t.retryCount + 1, createdAt: new Date().toISOString() });
        }
      }
    } else {
      // Increment retry count
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const t of ready) {
        store.put({ ...t, retryCount: t.retryCount + 1, createdAt: new Date().toISOString() });
      }
    }
  } catch {
    // Silently fail - will retry on next attempt
  }
}

/**
 * Get the count of pending offline transactions.
 */
export async function getPendingCount(): Promise<number> {
  try {
    const unsynced = await getUnsyncedTransactions();
    return unsynced.length;
  } catch {
    return 0;
  }
}

/**
 * Mark an existing offline transaction as deleted.
 * The tombstone will be synced to the server on the next sync attempt.
 */
export async function markOfflineDeleted(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(localId);

    getReq.onsuccess = () => {
      const record = getReq.result as OfflineTransaction | undefined;
      if (record) {
        record.deletedAt = new Date().toISOString();
        record.synced = false;
        record.version += 1;
        store.put(record);
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => {
      attemptSync().catch(console.error);
      resolve();
    };
  });
}

// Auto-sync every 30 seconds if online
if (typeof window !== "undefined") {
  setInterval(() => {
    if (navigator.onLine) {
      attemptSync().catch(() => {});
    }
  }, 30000);

  window.addEventListener("online", () => {
    attemptSync().catch(() => {});
  });
}
