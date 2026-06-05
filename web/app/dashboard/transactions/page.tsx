import { auth } from "@/lib/auth";
import { listTransactions } from "@/services/transaction";
import { getCategories } from "@/services/category";
import { getPaymentMethods } from "@/services/payment-method";
import { TransactionList } from "@/components/TransactionList";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  const [result, categories, paymentMethods] = await Promise.all([
    listTransactions(userId, {
      page,
      limit,
      type: (params.type as "income" | "expense") || undefined,
      categoryId: params.categoryId,
      sortBy: "timestamp",
      sortOrder: "desc",
    }),
    getCategories(userId),
    getPaymentMethods(userId),
  ]);

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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Transactions</h1>
        <p className="text-sm text-slate-400">View, filter, and manage your income and expenses.</p>
      </div>
      <TransactionList
        transactions={JSON.parse(JSON.stringify(result.transactions))}
        categories={serializedCategories}
        paymentMethods={serializedPaymentMethods}
        pagination={result.pagination}
      />
    </div>
  );
}
