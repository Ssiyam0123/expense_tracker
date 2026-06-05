"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fromMinorUnits, toMinorUnits } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  type: "income" | "expense";
}

interface TransactionRecord {
  _id: string;
  amountMinor: number;
  currency: string;
  type: "income" | "expense";
  note?: string;
  timestamp: string;
  tags?: string[];
  categoryId?: { _id: string; name: string; icon?: string; color?: string };
  paymentMethodId?: { _id: string; name: string; icon?: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaymentMethod {
  _id: string;
  name: string;
  icon?: string;
}

interface Props {
  transactions: TransactionRecord[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  pagination: Pagination;
}

export function TransactionList({ transactions, categories, paymentMethods, pagination }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "";
  const currentCategory = searchParams.get("categoryId") || "";

  // Edit transaction state
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPaymentMethodId, setEditPaymentMethodId] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const handleStartEdit = (tx: TransactionRecord) => {
    setEditingTx(tx);
    setEditAmount(fromMinorUnits(tx.amountMinor).toString());
    setEditType(tx.type);
    setEditCategoryId(tx.categoryId?._id || "");
    setEditPaymentMethodId(tx.paymentMethodId?._id || "");
    setEditNote(tx.note || "");
    
    const d = new Date(tx.timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setEditDate(`${year}-${month}-${day}`);
    setEditError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editAmount || !editCategoryId || !editPaymentMethodId) return;

    setEditSubmitting(true);
    setEditError("");

    try {
      const numAmount = parseFloat(editAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setEditError("Amount must be a positive number");
        setEditSubmitting(false);
        return;
      }

      // Preserve hours/minutes/seconds of original timestamp
      const origTime = new Date(editingTx.timestamp);
      const timeStr = `${String(origTime.getHours()).padStart(2, '0')}:${String(origTime.getMinutes()).padStart(2, '0')}:${String(origTime.getSeconds()).padStart(2, '0')}`;
      const newTimestamp = new Date(`${editDate}T${timeStr}`).toISOString();

      const res = await fetch(`/api/v1/transactions/${editingTx._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountMinor: toMinorUnits(numAmount),
          type: editType,
          categoryId: editCategoryId,
          paymentMethodId: editPaymentMethodId,
          note: editNote || null,
          timestamp: newTimestamp,
        }),
      });

      const body = await res.json();
      if (res.ok && body.data) {
        setEditingTx(null);
        router.refresh();
      } else {
        setEditError(body.error?.message || "Failed to update transaction");
      }
    } catch (err) {
      setEditError("Failed to connect to the server");
    } finally {
      setEditSubmitting(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction");
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={currentType}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("categoryId", e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <a
          href="/api/v1/export.csv"
          className="ml-auto rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          Export CSV
        </a>
      </div>

      {/* Transaction list */}
      <div className="overflow-hidden rounded-xl border border-border">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <p className="text-lg">No transactions found</p>
            <p className="mt-1 text-sm">Add your first transaction from the dashboard</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-card-hover/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-border text-lg">
                    {tx.categoryId?.icon || (tx.type === "income" ? "💰" : "💸")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {tx.categoryId?.name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{tx.paymentMethodId?.name || "Unknown"}</span>
                      <span>•</span>
                      <span>
                        {new Date(tx.timestamp).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      tx.type === "expense" ? "text-expense" : "text-income"
                    }`}
                  >
                    {tx.type === "expense" ? "−" : "+"}৳
                    {fromMinorUnits(tx.amountMinor).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleStartEdit(tx)}
                    className="rounded-lg p-1 text-muted transition-colors hover:bg-accent/15 hover:text-accent"
                    title="Edit transaction"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tx._id)}
                    className="rounded-lg p-1 text-muted transition-colors hover:bg-expense/10 hover:text-expense"
                    title="Delete transaction"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <p>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📝</span> Edit Transaction
              </h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs text-danger">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Type</label>
                <div className="flex max-w-[200px] rounded-xl bg-slate-900/60 p-1 border border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditType("expense");
                      const matchingCats = categories.filter((c) => c.type === "expense");
                      if (matchingCats.length > 0 && !matchingCats.some(c => c._id === editCategoryId)) {
                        setEditCategoryId(matchingCats[0]._id);
                      }
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                      editType === "expense"
                        ? "bg-danger text-white shadow-lg shadow-danger/25"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditType("income");
                      const matchingCats = categories.filter((c) => c.type === "income");
                      if (matchingCats.length > 0 && !matchingCats.some(c => c._id === editCategoryId)) {
                        setEditCategoryId(matchingCats[0]._id);
                      }
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                      editType === "income"
                        ? "bg-accent text-white shadow-lg shadow-accent/25"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Amount (BDT)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Category</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
                >
                  {categories
                    .filter((c) => c.type === editType)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id} className="bg-slate-950 text-white">
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Payment Method</label>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-white/[0.05] bg-slate-900/40">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm._id}
                      type="button"
                      onClick={() => setEditPaymentMethodId(pm._id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                        editPaymentMethodId === pm._id
                          ? "bg-accent/15 text-accent border-accent/40 shadow-sm"
                          : "bg-slate-950/40 text-slate-400 border-white/[0.05] hover:text-white hover:border-white/[0.12]"
                      }`}
                    >
                      <span>{pm.icon}</span>
                      <span>{pm.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer [color-scheme:dark]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Note</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Note (optional)"
                  maxLength={500}
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all flex items-center gap-1.5"
                >
                  {editSubmitting && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
