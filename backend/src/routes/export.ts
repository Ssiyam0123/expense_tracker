import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiError } from "../utils/response";
import { logger } from "../utils/logger";
import { listTransactions } from "../services/transaction";
import { fromMinorUnits } from "../utils/helpers";

const router = Router();
router.use(authenticate);

// GET /api/v1/export.csv
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;

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
        const note = ((t.note as string) || "").replace(/"/g, '""');
        const tags = Array.isArray(t.tags)
          ? (t.tags as string[]).join("; ")
          : "";

        return `${timestamp},${type},"${category}","${pm}",${sign}${amount},${t.currency},"${note}","${tags}"`;
      })
      .join("\n");

    const csv = header + rows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expenses_${year || "all"}_${month || "all"}.csv"`
    );
    res.send(csv);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/export.csv error");
    apiError(res, "INTERNAL", "Failed to export CSV", 500);
  }
});

export default router;
