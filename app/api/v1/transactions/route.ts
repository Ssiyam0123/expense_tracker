import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { listTransactions, createTransaction } from "@/services/transaction";
import {
  listTransactionsSchema,
  createTransactionSchema,
} from "@/schemas/transaction";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const parsed = listTransactionsSchema.safeParse(query);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid query parameters", 400, parsed.error.flatten());
    }

    const result = await listTransactions(userId, parsed.data);
    return apiSuccess(result.transactions, result.pagination as unknown as Record<string, unknown>);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/transactions error");
    return apiError("INTERNAL", "Failed to fetch transactions", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const transaction = await createTransaction(userId, parsed.data);
    return apiSuccess(transaction);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/transactions error");
    return apiError("INTERNAL", "Failed to create transaction", 500);
  }
}
