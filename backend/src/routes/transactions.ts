import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiSuccess, apiError } from "../utils/response";
import { logger } from "../utils/logger";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  syncTransactions,
} from "../services/transaction";
import {
  createTransactionSchema,
  updateTransactionSchema,
  syncTransactionSchema,
} from "../schemas/transaction";
import { isValidObjectId } from "../utils/validation";

const router = Router();
router.use(authenticate);

// GET /api/v1/transactions
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const type = (["income", "expense"].includes(req.query.type as string) ? req.query.type : undefined) as "income" | "expense" | undefined;
    const categoryId = (req.query.categoryId as string) || undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const sortBy = (["timestamp", "amountMinor", "createdAt"].includes(req.query.sortBy as string) ? req.query.sortBy : "timestamp") as "timestamp" | "amountMinor" | "createdAt";
    const sortOrder = (["asc", "desc"].includes(req.query.sortOrder as string) ? req.query.sortOrder : "desc") as "asc" | "desc";

    const result = await listTransactions(userId, {
      page,
      limit,
      type,
      categoryId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    apiSuccess(res, result.transactions, result.pagination as unknown as Record<string, unknown>);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/transactions error");
    apiError(res, "INTERNAL", "Failed to fetch transactions", 500);
  }
});

// POST /api/v1/transactions
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const transaction = await createTransaction(userId, parsed.data);
    apiSuccess(res, transaction);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/transactions error");
    apiError(res, "INTERNAL", "Failed to create transaction", 500);
  }
});

// POST /api/v1/transactions/sync
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = syncTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const results = await syncTransactions(userId, parsed.data);
    apiSuccess(res, results, { syncedCount: results.length });
  } catch (err) {
    logger.error({ err }, "POST /api/v1/transactions/sync error");
    apiError(res, "INTERNAL", "Failed to sync transactions", 500);
  }
});

// PATCH /api/v1/transactions/:id
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = updateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const { id } = req.params as Record<string, string>;

    if (!isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Invalid transaction ID", 400);
      return;
    }

    const transaction = await updateTransaction(userId, id, parsed.data as Record<string, unknown>);
    apiSuccess(res, transaction);
  } catch (err) {
    logger.error({ err }, "PATCH /api/v1/transactions/:id error");
    if ((err as Error).message === "Transaction not found") {
      apiError(res, "NOT_FOUND", "Transaction not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to update transaction", 500);
  }
});

// DELETE /api/v1/transactions/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id: deleteId } = req.params as Record<string, string>;

    if (!deleteId || deleteId.length < 1) {
      apiError(res, "VALIDATION", "Transaction ID is required", 400);
      return;
    }

    if (!isValidObjectId(deleteId)) {
      apiError(res, "VALIDATION", "Invalid transaction ID", 400);
      return;
    }

    await deleteTransaction(userId, deleteId);
    apiSuccess(res, { deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/transactions/:id error");
    if ((err as Error).message === "Transaction not found") {
      apiError(res, "NOT_FOUND", "Transaction not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to delete transaction", 500);
  }
});

export default router;
