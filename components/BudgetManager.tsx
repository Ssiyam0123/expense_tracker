"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromMinorUnits, toMinorUnits } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Budget {
  _id: string;
  categoryId: { _id: string; name: string; icon?: string; color?: string } | null;
  amountMinor: number;
  currency: string;
  period: string;
  month: number;
  year: number;
  alertThreshold?: number;
}

interface BudgetStatus {
  budgetId: string;
  categoryId: { _id?: string } | string;
  spentAmount: number;
  percentage: number;
  isOverBudget: boolean;
  isNearThreshold: boolean;
  remainingAmount: number;
}

interface Props {
  budgets: Budget[];
  categories: Category[];
  currentMonth: number;
  currentYear: number;
  budgetStatus: BudgetStatus[];
}

export function BudgetManager({
  budgets,
  categories,
  currentMonth,
  currentYear,
  budgetStatus,
}: Props) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;

    setSubmitting(true);
    setStatus("idle");

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return;

      const res = await fetch("/api/v1/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amountMinor: toMinorUnits(numAmount),
          month: currentMonth,
          year: currentYear,
          alertThreshold,
        }),
      });

      if (res.ok) {
        setAmount("");
        setCategoryId("");
        setStatus("success");
        router.refresh();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/budgets?id=${id}`, { method: "DELETE" });
    router.refresh();
  };

  const usedCategoryIds = budgets
    .map((b) => b.categoryId?._id)
    .filter(Boolean);

  const availableCategories = categories.filter(
    (c) => !usedCategoryIds.includes(c._id)
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Create budget form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">
          Set Budget for {new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>

        {availableCategories.length === 0 && budgets.length > 0 ? (
          <p className="text-sm text-muted">
            Budgets set for all categories this month.
          </p>
        ) : availableCategories.length === 0 ? (
          <p className="text-sm text-muted">
            Create expense categories first to set budgets.
          </p>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Category</label>
              <div className="flex flex-wrap gap-1">
                {availableCategories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setCategoryId(cat._id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      categoryId === cat._id
                        ? "bg-accent/20 text-accent ring-1 ring-accent/50"
                        : "bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted">
                  Budget (BDT)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted/50 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs text-muted">Alert at</label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-2 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none"
                >
                  <option value={50}>50%</option>
                  <option value={60}>60%</option>
                  <option value={70}>70%</option>
                  <option value={80}>80%</option>
                  <option value={90}>90%</option>
                  <option value={100}>100%</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !categoryId || !amount}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Setting..." : "Set Budget"}
            </button>

            {status === "success" && (
              <p className="text-xs text-income">✓ Budget set successfully</p>
            )}
            {status === "error" && (
              <p className="text-xs text-expense">✗ Failed to set budget</p>
            )}
          </form>
        )}
      </div>

      {/* Budgets list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Active Budgets</h2>
        {budgets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted">
            <p>No budgets set for this month</p>
          </div>
        ) : (
          budgets.map((b) => {
            const status = budgetStatus.find((bs) => bs.budgetId === b._id);
            const pct = status?.percentage ?? 0;
            return (
              <div
                key={b._id}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{b.categoryId?.icon || "📌"}</span>
                    <span className="text-sm font-medium">
                      {b.categoryId?.name || "Unknown"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="rounded px-2 py-0.5 text-xs text-muted transition-colors hover:text-expense"
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                  <span>
                    ৳{fromMinorUnits(status?.spentAmount ?? 0).toLocaleString()} / ৳{fromMinorUnits(b.amountMinor).toLocaleString()}
                  </span>
                  <span className="font-mono tabular-nums">
                    Alert: {b.alertThreshold}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (b.alertThreshold && pct >= b.alertThreshold)
                        ? "bg-warning"
                        : "bg-accent"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
