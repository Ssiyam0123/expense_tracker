import { getOfflineDB } from "./schema";
import { getDeviceId, apiPost } from "@/lib/api";
import { generateLocalId } from "@/lib/utils";

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

/**
 * Trigger a sync attempt. Debounces automatically via isSyncing flag.
 */
export async function triggerSync(): Promise<void> {
  if (isSyncing) return;
  await performSync();
}

/**
 * Initialize background sync polling every 30 seconds.
 */
export function startBackgroundSync(): void {
  if (syncTimer) return;
  syncTimer = setInterval(() => {
    performSync().catch(() => {});
  }, 30_000);
}

/**
 * Stop background sync polling.
 */
export function stopBackgroundSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

async function performSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const db = await getOfflineDB();
    const pending = await db.getAllAsync<{
      id: string;
      server_id: string | null;
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

    if (pending.length === 0) {
      isSyncing = false;
      return;
    }

    const deviceId = await getDeviceId();
    const payload = {
      transactions: pending.map((row) => ({
        localId: row.id,
        sourceDeviceId: deviceId,
        amountMinor: row.amount_minor,
        currency: row.currency,
        type: row.type as "income" | "expense",
        categoryId: row.category_id,
        paymentMethodId: row.payment_method_id,
        timestamp: row.timestamp,
        note: row.note || null,
        tags: safeParseTags(row.tags),
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
          // Increment retry count in sync_queue
          await db.runAsync(
            `INSERT INTO sync_queue (entity_type, entity_id, action, payload, retry_count, last_attempt)
             VALUES ('transaction', ?, 'update', ?, 1, datetime('now'))`,
            [result.localId, JSON.stringify(payload.transactions.find(t => t.localId === result.localId) || {})]
          );
          continue;
        }

        if (result.status === "deleted") {
          await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [result.localId]);
        } else {
          // Mark as synced
          await db.runAsync(
            `UPDATE transactions SET sync_status = 'synced', server_id = ? WHERE id = ?`,
            [result.serverId || null, result.localId]
          );
        }
      }
    } else {
      // Server error - will retry on next sync
      for (const row of pending) {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync_queue (entity_type, entity_id, action, payload, retry_count, last_attempt)
           VALUES ('transaction', ?, 'update', ?, 1, datetime('now'))`,
          [row.id, JSON.stringify({})]
        );
      }
    }
  } catch {
    // Network error - will retry on next sync
  } finally {
    isSyncing = false;
  }
}

function safeParseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
