import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { syncTransactions } from "@/services/transaction";
import { syncTransactionSchema } from "@/schemas/transaction";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const parsed = syncTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const results = await syncTransactions(userId, parsed.data);
    return apiSuccess(results, { syncedCount: results.length });
  } catch (err) {
    logger.error({ err }, "POST /api/v1/transactions/sync error");
    return apiError("INTERNAL", "Failed to sync transactions", 500);
  }
}
