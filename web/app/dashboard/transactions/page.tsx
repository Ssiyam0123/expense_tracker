import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/server-api";
import { TransactionList } from "@/components/TransactionList";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const [txResultRes, categoriesRes, paymentMethodsRes] = await Promise.all([
    serverApi.get("/api/v1/transactions", {
      page,
      limit,
      type: params.type,
      categoryId: params.categoryId,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: params.sortBy || "timestamp",
      sortOrder: params.sortOrder || "desc",
    }),
    serverApi.get("/api/v1/categories"),
    serverApi.get("/api/v1/payment-methods"),
  ]);

  if (!txResultRes.data || !categoriesRes.data || !paymentMethodsRes.data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Transactions</h1>
          <p className="text-sm text-slate-400">View, filter, and manage your income and expenses.</p>
        </div>
        <div className="p-8 text-center text-slate-400">Failed to load transactions.</div>
      </div>
    );
  }

  // Serialize API response to plain objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txResult: any = JSON.parse(JSON.stringify(txResultRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = JSON.parse(JSON.stringify(categoriesRes.data));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentMethods: any[] = JSON.parse(JSON.stringify(paymentMethodsRes.data));

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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Transactions</h1>
        <p className="text-sm text-slate-400">View, filter, and manage your income and expenses.</p>
      </div>
      <TransactionList
        transactions={Array.isArray(txResult) ? txResult : (txResult?.transactions || [])}
        categories={serializedCategories}
        paymentMethods={serializedPaymentMethods}
        pagination={(txResultRes.meta as any) || { page: 1, limit: 20, total: 0, totalPages: 1 }}
      />
    </div>
  );
}
