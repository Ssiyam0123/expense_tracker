import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/services/dashboard";
import { getCategories } from "@/services/category";
import { getPaymentMethods } from "@/services/payment-method";
import { listTransactions } from "@/services/transaction";
import { fromMinorUnits } from "@/lib/utils";
import { QuickLogForm } from "@/components/QuickLogForm";
import { DashboardSummary } from "@/components/DashboardSummary";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [summary, categories, paymentMethods, txResult] = await Promise.all([
    getDashboardSummary(userId, month, year),
    getCategories(userId),
    getPaymentMethods(userId),
    listTransactions(userId, { limit: 100, page: 1 }),
  ]);

  // Serialize Mongoose objects to plain objects
  const serializedCategories = categories.map((c) => ({
    _id: (c._id as object).toString(),
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
  }));

  const serializedPaymentMethods = paymentMethods.map((p) => ({
    _id: (p._id as object).toString(),
    name: p.name,
    icon: p.icon,
  }));

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
        summary={JSON.parse(JSON.stringify(summary))}
        transactions={JSON.parse(JSON.stringify(txResult.transactions))}
      />

      <QuickLogForm
        categories={serializedCategories}
        paymentMethods={serializedPaymentMethods}
      />
    </div>
  );
}
