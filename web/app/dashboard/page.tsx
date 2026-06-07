import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/server-api";
import { QuickLogForm } from "@/components/QuickLogForm";
import { DashboardSummary } from "@/components/DashboardSummary";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [summaryRes, categoriesRes, paymentMethodsRes, txResultRes] = await Promise.all([
    serverApi.get("/api/v1/dashboard/summary", { month, year }),
    serverApi.get("/api/v1/categories"),
    serverApi.get("/api/v1/payment-methods"),
    serverApi.get("/api/v1/transactions", { limit: 100, page: 1, sortBy: "timestamp", sortOrder: "desc" }),
  ]);

  if (!summaryRes.data || !categoriesRes.data || !paymentMethodsRes.data || !txResultRes.data) {
    return <div className="p-8 text-center text-muted">Failed to load dashboard data.</div>;
  }

  // Serialize API response to plain objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary: any = JSON.parse(JSON.stringify(summaryRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = JSON.parse(JSON.stringify(categoriesRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentMethods: any[] = JSON.parse(JSON.stringify(paymentMethodsRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txResult: any = JSON.parse(JSON.stringify(txResultRes.data));

  const serializedCategories = categories.map(
    (c: { _id: string; name: string; icon?: string; color?: string; type: string }) => ({
      _id: c._id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type as "income" | "expense",
    })
  );

  const serializedPaymentMethods = paymentMethods.map(
    (p: { _id: string; name: string; icon?: string }) => ({
      _id: p._id,
      name: p.name,
      icon: p.icon,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">
          {new Date(year, month - 1).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <DashboardSummary
        summary={summary}
        transactions={Array.isArray(txResult) ? txResult : (txResult?.transactions || [])}
      />

      <QuickLogForm
        categories={serializedCategories}
        paymentMethods={serializedPaymentMethods}
      />
    </div>
  );
}
