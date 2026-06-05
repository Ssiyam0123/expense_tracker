import { auth } from "@/lib/auth";
import { getBudgets } from "@/services/budget";
import { getCategories } from "@/services/category";
import { getDashboardSummary } from "@/services/dashboard";
import { BudgetManager } from "@/components/BudgetManager";

export default async function BudgetsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgets, categories, summary] = await Promise.all([
    getBudgets(userId, month, year),
    getCategories(userId),
    getDashboardSummary(userId, month, year),
  ]);

  const serializedBudgets = budgets.map((b) => ({
    _id: (b._id as object).toString(),
    categoryId:
      typeof b.categoryId === "object" && b.categoryId !== null
        ? {
            _id: ((b.categoryId as Record<string, unknown>)._id as object).toString(),
            name: (b.categoryId as Record<string, string>).name,
            icon: (b.categoryId as Record<string, string>).icon,
            color: (b.categoryId as Record<string, string>).color,
          }
        : null,
    amountMinor: b.amountMinor,
    currency: b.currency,
    period: b.period,
    month: b.month,
    year: b.year,
    alertThreshold: b.alertThreshold,
  }));

  const serializedCategories = categories.map((c) => ({
    _id: (c._id as object).toString(),
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
      <BudgetManager
        budgets={serializedBudgets}
        categories={serializedCategories.filter((c) => c.type === "expense")}
        currentMonth={month}
        currentYear={year}
        budgetStatus={JSON.parse(JSON.stringify(summary.budgetStatus))}
      />
    </div>
  );
}
