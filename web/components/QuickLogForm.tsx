"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toMinorUnits } from "@/lib/utils";
import { saveOfflineTransaction } from "@/lib/offline-sync";

interface Category {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  type: "income" | "expense";
}

interface PaymentMethod {
  _id: string;
  name: string;
  icon?: string;
}

interface Props {
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

const EMOJI_PRESETS = [
  "🍔", "🏠", "🚗", "🎬", "🛒", "⚡", "💼", "📈",
  "🎁", "💸", "🏋️", "🏥", "📚", "👕", "💡", "✈️"
];

const COLOR_PRESETS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#EAB308"  // Yellow
];

export function QuickLogForm({ categories, paymentMethods }: Props) {
  const router = useRouter();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Category addition states
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newLocalCategories, setNewLocalCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍔");
  const [newCatColor, setNewCatColor] = useState("#3B82F6");
  const [newCatSubmitting, setNewCatSubmitting] = useState(false);
  const [newCatError, setNewCatError] = useState("");

  const handleTypeChange = (newType: "expense" | "income") => {
    setType(newType);
    setCategoryId(""); // fallback to first item of new type
  };

  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>([]);

  const handleDeleteCategory = async (catId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Any transactions or budgets using it will be marked as 'Unknown'."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/categories?id=${catId}`, {
        method: "DELETE",
      });

      const body = await res.json();
      if (res.ok && body.data) {
        setDeletedCategoryIds((prev) => [...prev, catId]);
        if (categoryId === catId) {
          setCategoryId(""); // Reset active category if deleted
        }
        router.refresh();
      } else {
        setNewCatError(body.error?.message || "Failed to delete category");
      }
    } catch (err) {
      setNewCatError("Failed to connect to the server");
    }
  };

  const allCategories = [...categories, ...newLocalCategories].filter(
    (cat) => !deletedCategoryIds.includes(cat._id)
  );
  const uniqueCategories = allCategories.filter((cat, index, self) =>
    self.findIndex(c => c._id === cat._id) === index
  );
  const filteredCategories = uniqueCategories.filter((c) => c.type === type);

  const defaultCategory =
    filteredCategories.length > 0 ? filteredCategories[0]._id : "";

  // Set default payment method to "Cash" if available
  const cashPayment = paymentMethods.find(
    (pm) => pm.name.toLowerCase() === "cash"
  );
  const defaultPayment = cashPayment
    ? cashPayment._id
    : paymentMethods.length > 0
    ? paymentMethods[0]._id
    : "";

  const activeCategory = categoryId || defaultCategory;
  const activePayment = paymentMethodId || defaultPayment;

  const resetForm = useCallback(() => {
    setAmount("");
    setNote("");
    setCategoryId("");
    setStatus("success");
    router.refresh();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !activeCategory || !activePayment) return;

      setSubmitting(true);
      setStatus("idle");

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const timestamp = new Date(`${date}T${timeStr}`).toISOString();

      try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        const res = await fetch("/api/v1/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountMinor: toMinorUnits(numAmount),
            currency: "BDT",
            type,
            categoryId: activeCategory,
            paymentMethodId: activePayment,
            note: note || undefined,
            timestamp,
          }),
        });

        if (res.ok) {
          resetForm();
        } else {
          setStatus("error");
        }
      } catch {
        // Fall back to offline storage
        try {
          const numAmount = parseFloat(amount);
          if (!isNaN(numAmount) && numAmount > 0) {
            await saveOfflineTransaction({
              amount: numAmount,
              type,
              categoryId: activeCategory,
              paymentMethodId: activePayment,
              note: note || undefined,
              timestamp,
            });
            resetForm();
            setStatus("success");
            return;
          }
        } catch {
          // Offline save also failed
        }
        setStatus("error");
      } finally {
        setSubmitting(false);
      }
    },
    [amount, activeCategory, activePayment, note, type, date, resetForm]
  );

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setNewCatSubmitting(true);
    setNewCatError("");

    try {
      const res = await fetch("/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          icon: newCatIcon,
          color: newCatColor,
          type,
        }),
      });

      const body = await res.json();
      if (res.ok && body.data) {
        const newCat = body.data;
        setNewLocalCategories((prev) => [...prev, newCat]);
        setCategoryId(newCat._id);
        setNewCatName("");
        setShowNewCategoryModal(false);
        router.refresh();
      } else {
        setNewCatError(body.error?.message || "Failed to create category");
      }
    } catch (err) {
      setNewCatError("Failed to connect to the server");
    } finally {
      setNewCatSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl border border-white/[0.08] bg-slate-900/40 backdrop-blur-xl shadow-2xl p-6 overflow-hidden transition-all duration-300 hover:border-white/[0.12]"
      >
        {/* Background radial gradient glow */}
        <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <h2 className="mb-4 text-sm font-semibold tracking-tight text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Quick Log Transaction
        </h2>

        {/* Type toggle */}
        <div className="mb-5 flex max-w-[200px] rounded-xl bg-slate-950/60 p-1 border border-white/[0.05]">
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              type === "expense"
                ? "bg-danger text-white shadow-lg shadow-danger/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              type === "income"
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Income
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Amount */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-400">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-white/[0.08] bg-slate-950/40 pl-3 pr-12 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                BDT
              </span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-400">Category</label>
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => {
                  if (e.target.value === "new") {
                    setShowNewCategoryModal(true);
                  } else {
                    setCategoryId(e.target.value);
                  }
                }}
                className="w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='%2394a3b8' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'></path></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                  paddingRight: "40px"
                }}
              >
                <option value="" disabled>Select category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat._id} className="bg-slate-900 text-white">
                    {cat.icon} {cat.name}
                  </option>
                ))}
                <option value="new" className="bg-slate-950 text-accent font-semibold">
                  ✨ + Add New Category...
                </option>
              </select>
            </div>
          </div>

          {/* Calendar Date Picker */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Note */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-400">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              maxLength={500}
              className="w-full rounded-lg border border-white/[0.08] bg-slate-950/40 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              disabled={submitting || !amount}
              className={`w-full flex items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
                type === "expense"
                  ? "bg-danger text-white hover:bg-danger-hover shadow-lg shadow-danger/20 hover:shadow-danger/35"
                  : "bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20 hover:shadow-accent/35"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : type === "expense" ? (
                "Log -"
              ) : (
                "Log +"
              )}
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mt-4 border-t border-white/[0.05] pt-4">
          <label className="mb-2 block text-xs font-medium text-slate-400">
            Payment Method
          </label>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm._id}
                type="button"
                onClick={() => setPaymentMethodId(pm._id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium border transition-all duration-300 ${
                  activePayment === pm._id
                    ? "bg-accent/15 text-accent border-accent/40 shadow-sm"
                    : "bg-slate-950/40 text-slate-400 border-white/[0.05] hover:text-white hover:border-white/[0.12]"
                }`}
              >
                <span className="text-sm">{pm.icon}</span>
                <span>{pm.name}</span>
              </button>
            ))}
          </div>
        </div>

        {status === "success" && (
          <p className="mt-3 text-xs text-income flex items-center gap-1.5 animate-pulse">
            <span>✓</span> Transaction logged successfully
          </p>
        )}
        {status === "error" && (
          <p className="mt-3 text-xs text-expense flex items-center gap-1.5">
            <span>✗</span> Failed to log transaction. Try again.
          </p>
        )}
      </form>

      {/* Glassmorphic Category Creation Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-accent">✨</span> Add {type === "expense" ? "Expense" : "Income"} Category
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCatName("");
                  setNewCatError("");
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {newCatError && (
              <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs text-danger">
                {newCatError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Subscriptions, Gifts"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-slate-600"
                />
              </div>

              {/* Icon Presets & Custom Input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Choose Icon</label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    placeholder="🍔"
                    maxLength={5}
                    className="w-16 rounded-lg border border-white/[0.08] bg-slate-900/60 py-2 text-center text-base text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <span className="text-xs text-slate-400">
                    Type/paste any emoji, or select a preset below:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-white/[0.05] bg-slate-900/40 justify-center sm:justify-start">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      className={`h-9 w-9 text-lg flex items-center justify-center rounded-lg transition-all ${
                        newCatIcon === emoji
                          ? "bg-accent/20 border border-accent/50 text-white scale-105"
                          : "hover:bg-white/5 border border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets & Custom Picker */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Choose Color</label>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="relative h-8 w-8 rounded-full border border-white/[0.12] overflow-hidden cursor-pointer shadow-inner flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ backgroundColor: newCatColor }}
                  >
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                    />
                    <span className="text-[10px] pointer-events-none mix-blend-difference text-white font-bold">
                      🎨
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    placeholder="#3B82F6"
                    maxLength={7}
                    className="w-24 rounded-lg border border-white/[0.08] bg-slate-900/60 px-2.5 py-1.5 text-xs text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 uppercase"
                  />
                  <span className="text-xs text-slate-400">
                    Click color circle or pick a preset:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-white/[0.05] bg-slate-900/40">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`h-6 w-6 rounded-full transition-all border-2 ${
                        newCatColor === color
                          ? "border-white scale-110 shadow-lg"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setNewCatName("");
                    setNewCatError("");
                  }}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newCatSubmitting || !newCatName.trim()}
                  className="rounded-lg bg-accent text-white hover:bg-accent-hover px-4 py-2 text-xs font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all flex items-center gap-1.5"
                >
                  {newCatSubmitting && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  )}
                  Save Category
                </button>
              </div>
            </form>

            {/* Existing Categories list */}
            <div className="mt-6 border-t border-white/[0.08] pt-4">
              <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                Existing {type === "expense" ? "Expense" : "Income"} Categories
              </h4>
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No categories found</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between rounded-lg bg-slate-900/40 border border-white/[0.03] px-3 py-2 text-sm text-white transition-colors hover:border-white/[0.08]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span className="font-medium text-xs">{cat.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat._id)}
                        className="text-slate-400 hover:text-danger rounded p-1 transition-colors hover:bg-danger/10"
                        title="Delete category"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
