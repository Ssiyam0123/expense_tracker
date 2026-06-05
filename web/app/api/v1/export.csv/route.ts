import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { listTransactions } from "@/services/transaction";
import { fromMinorUnits } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    // Fetch a large batch of transactions for the period
    const result = await listTransactions(userId, {
      page: 1,
      limit: 10000,
      sortBy: "timestamp",
      sortOrder: "desc",
    });

    // Build CSV
    const header =
      "Date,Type,Category,Payment Method,Amount,Currency,Note,Tags\n";
    const rows = result.transactions
      .map((t: Record<string, unknown>) => {
        const amount = fromMinorUnits(t.amountMinor as number);
        const type = t.type;
        const sign = type === "expense" ? "-" : "";
        const category =
          (t.categoryId as Record<string, string> | null)?.name || "Unknown";
        const pm =
          (t.paymentMethodId as Record<string, string> | null)?.name ||
          "Unknown";
        const timestamp = t.timestamp
          ? new Date(t.timestamp as string).toISOString().split("T")[0]
          : "";
        const note = (t.note as string || "").replace(/"/g, '""');
        const tags = Array.isArray(t.tags)
          ? (t.tags as string[]).join("; ")
          : "";

        return `${timestamp},${type},"${category}","${pm}",${sign}${amount},${t.currency},"${note}","${tags}"`;
      })
      .join("\n");

    const csv = header + rows;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses_${year || "all"}_${month || "all"}.csv"`,
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /api/v1/export.csv error");
    return apiError("INTERNAL", "Failed to export CSV", 500);
  }
}
