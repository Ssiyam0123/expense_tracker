import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getOfflineDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("expense_tracker.db");

  // Enable WAL mode for better concurrent reads
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      amount_minor INTEGER NOT NULL,
      currency TEXT DEFAULT 'BDT',
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category_id TEXT NOT NULL,
      payment_method_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      note TEXT,
      tags TEXT,
      sync_status TEXT CHECK(sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete')) DEFAULT 'pending_create',
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT NOT NULL,
      icon TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT CHECK(action IN ('create', 'update', 'delete')) NOT NULL,
      payload TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_attempt TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_txns_sync_status ON transactions(sync_status);
    CREATE INDEX IF NOT EXISTS idx_txns_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_txns_type ON transactions(type);
  `);

  return db;
}

export async function resetOfflineDB(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  await SQLite.deleteDatabaseAsync("expense_tracker.db");
}
