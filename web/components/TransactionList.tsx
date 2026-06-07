"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, API_URL } from "@/lib/api-client";
import { fromMinorUnits, toMinorUnits } from "@/lib/utils";
import { showToast } from "@/lib/toast";

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

export function TransactionList({
  transactions = [],
  categories = [],
  paymentMethods = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "";
  const currentCategory = searchParams.get("categoryId") || "";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";
  const currentSortBy = searchParams.get("sortBy") || "timestamp";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

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
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setEditDate(`${year}-${month}-${day}`);
    } else {
      setEditDate("");
    }
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

      const res = await api.patch(`/api/v1/transactions/${editingTx._id}`, {
        amountMinor: toMinorUnits(numAmount),
          type: editType,
          categoryId: editCategoryId,
          paymentMethodId: editPaymentMethodId,
          note: editNote || null,
          timestamp: newTimestamp,
      });

      if (res.data) {
        setEditingTx(null);
        showToast("Transaction updated successfully!", "success");
        router.refresh();
      } else {
        setEditError(res.error?.message || "Failed to update transaction");
        showToast(res.error?.message || "Failed to update transaction", "error");
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
      const res = await api.delete(`/api/v1/transactions/${id}`);
      if (res.data) {
        showToast("Transaction deleted successfully!", "success");
        router.refresh();
      } else {
        alert("Failed to delete transaction");
        showToast("Failed to delete transaction", "error");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction");
      showToast("Failed to connect to the server", "error");
    }
  };

  const formatDateSafe = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return "Unknown Date";
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Unknown Date";
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
        {/* Row 1: Main filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Type</label>
            <select
              value={currentType}
              onChange={(e) => updateFilter("type", e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-3.5 py-2 text-sm text-white focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer hover:border-white/[0.15]"
            >
              <option value="" className="bg-slate-950 text-white">All types</option>
              <option value="expense" className="bg-slate-950 text-white">Expense</option>
              <option value="income" className="bg-slate-950 text-white">Income</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Category</label>
            <select
              value={currentCategory}
              onChange={(e) => updateFilter("categoryId", e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-3.5 py-2 text-sm text-white focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer hover:border-white/[0.15]"
            >
              <option value="" className="bg-slate-950 text-white">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-slate-950 text-white">
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Start Date</label>
            <input
              type="date"
              value={currentStartDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-3.5 py-2 text-sm text-white focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer hover:border-white/[0.15] [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">End Date</label>
            <input
              type="date"
              value={currentEndDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-3.5 py-2 text-sm text-white focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer hover:border-white/[0.15] [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Row 2: Sorting and Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Sort By</label>
              <select
                value={currentSortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-3 py-1.5 text-xs text-white focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer hover:border-white/[0.15]"
              >
                <option value="timestamp" className="bg-slate-950 text-white">Date & Time</option>
                <option value="amountMinor" className="bg-slate-950 text-white">Amount</option>
                <option value="createdAt" className="bg-slate-950 text-white">Created Time</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Sort Order</label>
              <select
                value={currentSortOrder}
                onChange={(e) => updateFilter("sortOrder", e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-3 py-1.5 text-xs text-white focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer hover:border-white/[0.15]"
              >
                <option value="desc" className="bg-slate-950 text-white">Descending</option>
                <option value="asc" className="bg-slate-950 text-white">Ascending</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-end">
            {(currentType || currentCategory || currentStartDate || currentEndDate || currentSortBy !== "timestamp" || currentSortOrder !== "desc") && (
              <button
                onClick={() => router.push("/dashboard/transactions")}
                className="rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-400 transition-all"
              >
                🧹 Reset Filters
              </button>
            )}
            <a
              href={`${API_URL}/api/v1/export.csv`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-4 py-2.5 text-xs text-slate-300 font-semibold transition-all hover:bg-white/5 hover:border-white/[0.15] hover:text-white"
            >
              📤 Export CSV
            </a>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      {safeTransactions.length === 0 ? (
        <div className="p-12 text-center text-muted rounded-2xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-md">
          <p className="text-lg">No transactions found</p>
          <p className="mt-1 text-sm">Add your first transaction from the dashboard</p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeTransactions.map((tx) => (
            <div
              key={tx._id}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20 flex flex-col gap-3"
            >
              {/* Type left border accent */}
              <div className={`absolute left-0 top-0 h-full w-[3.5px] ${tx.type === "expense" ? "bg-danger" : "bg-income"}`} />
              
              {/* Top Row: Icon, Category Name, Badge (Left) & Amount (Right) */}
              <div className="flex items-center justify-between gap-3 pl-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-xl shadow-inner">
                    {tx.categoryId?.icon || (tx.type === "income" ? "💰" : "💸")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-white tracking-tight truncate">
                        {tx.categoryId?.name || "Unknown"}
                      </h4>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                        tx.type === "expense" ? "bg-danger/10 text-danger border border-danger/20" : "bg-income/10 text-income border border-income/20"
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-mono text-base font-bold tracking-tight tabular-nums ${
                    tx.type === "expense" ? "text-danger" : "text-income"
                  }`}>
                    {tx.type === "expense" ? "−" : "+"}৳{fromMinorUnits(tx.amountMinor).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Second Row: Pills (Payment Method, Date) & Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.04] pt-3 pl-1 mt-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg px-2 py-1">
                    <span className="text-sm shrink-0">{tx.paymentMethodId?.icon || "💳"}</span>
                    <span className="font-semibold text-slate-300">{tx.paymentMethodId?.name || "Unknown"}</span>
                  </span>
                  
                  <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg px-2 py-1 font-mono text-[11px]">
                    📅 {formatDateSafe(tx.timestamp)}
                  </span>

                  {tx.note && (
                    <span className="hidden sm:flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg px-2 py-1 max-w-[200px] xl:max-w-[300px]" title={tx.note}>
                      💬 <span className="italic truncate">{tx.note}</span>
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-0.5 shadow-sm">
                  <button
                    onClick={() => handleStartEdit(tx)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-accent hover:bg-accent/15 transition-all"
                    title="Edit transaction"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tx._id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-danger hover:bg-danger/15 transition-all"
                    title="Delete transaction"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Note Row for Mobile */}
              {tx.note && (
                <div className="sm:hidden pl-1 mt-0.5">
                  <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-3 text-xs text-slate-400 italic leading-relaxed flex items-start gap-2 break-words min-w-0">
                    <span className="text-slate-500 shrink-0">💬</span>
                    <span className="flex-1 min-w-0">{tx.note}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 border-t border-white/[0.06] pt-4">
          <p className="text-xs sm:text-sm">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} transactions
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex-1 sm:flex-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex-1 sm:flex-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
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
