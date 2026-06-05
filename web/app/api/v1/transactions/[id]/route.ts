import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { updateTransaction, deleteTransaction } from "@/services/transaction";
import { updateTransactionSchema } from "@/schemas/transaction";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const transaction = await updateTransaction(
      userId,
      id,
      parsed.data as Record<string, unknown>
    );
    return apiSuccess(transaction);
  } catch (err) {
    logger.error({ err }, "PATCH /api/v1/transactions/:id error");
    if ((err as Error).message === "Transaction not found") {
      return apiError("NOT_FOUND", "Transaction not found", 404);
    }
    return apiError("INTERNAL", "Failed to update transaction", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    await deleteTransaction(userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/transactions/:id error");
    if ((err as Error).message === "Transaction not found") {
      return apiError("NOT_FOUND", "Transaction not found", 404);
    }
    return apiError("INTERNAL", "Failed to delete transaction", 500);
  }
}
