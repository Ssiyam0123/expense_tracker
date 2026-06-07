import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/server-api";
import { BudgetManager } from "@/components/BudgetManager";

export default async function BudgetsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgetsRes, categoriesRes, summaryRes] = await Promise.all([
    serverApi.get("/api/v1/budgets", { month, year }),
    serverApi.get("/api/v1/categories"),
    serverApi.get("/api/v1/dashboard/summary", { month, year }),
  ]);

  if (!budgetsRes.data || !categoriesRes.data || !summaryRes.data) {
    return <div className="p-8 text-center text-muted">Failed to load budgets.</div>;
  }

  // Serialize API response to plain objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const budgets: any[] = JSON.parse(JSON.stringify(budgetsRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = JSON.parse(JSON.stringify(categoriesRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary: any = JSON.parse(JSON.stringify(summaryRes.data));

  const serializedCategories = categories
    .filter((c: { type: string }) => c.type === "expense")
    .map((c: { _id: string; name: string; icon?: string; color?: string }) => ({
      _id: c._id,
      name: c.name,
      icon: c.icon,
      color: c.color,
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
      <BudgetManager
        budgets={budgets}
        categories={serializedCategories}
        currentMonth={month}
        currentYear={year}
        budgetStatus={summary.budgetStatus}
      />
    </div>
  );
}
