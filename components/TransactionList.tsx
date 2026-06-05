"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { fromMinorUnits } from "@/lib/utils";

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

interface Props {
  transactions: TransactionRecord[];
  categories: Category[];
  pagination: Pagination;
}

export function TransactionList({ transactions, categories, pagination }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "";
  const currentCategory = searchParams.get("categoryId") || "";

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
    </div>
  );
}
