import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiSuccess, apiError } from "../utils/response";
import { logger } from "../utils/logger";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/budget";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../schemas/budget";
import { isValidObjectId } from "../utils/validation";

const router = Router();
router.use(authenticate);

// GET /api/v1/budgets
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const month = req.query.month ? Math.max(1, Math.min(12, parseInt(req.query.month as string))) : undefined;
    const year = req.query.year ? Math.max(2020, Math.min(2100, parseInt(req.query.year as string))) : undefined;

    const budgets = await getBudgets(userId, month, year);
    apiSuccess(res, budgets);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/budgets error");
    apiError(res, "INTERNAL", "Failed to fetch budgets", 500);
  }
});

// POST /api/v1/budgets
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = createBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const budget = await createBudget(userId, parsed.data);
    apiSuccess(res, budget);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/budgets error");
    if ((err as Error).message.includes("already exists")) {
      apiError(res, "CONFLICT", (err as Error).message, 409);
      return;
    }
    apiError(res, "INTERNAL", "Failed to create budget", 500);
  }
});

// PATCH /api/v1/budgets
router.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, ...updates } = req.body;

    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Valid budget id is required", 400);
      return;
    }

    const parsed = updateBudgetSchema.safeParse(updates);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const budget = await updateBudget(userId, id, parsed.data);
    apiSuccess(res, budget);
  } catch (err) {
    logger.error({ err }, "PATCH /api/v1/budgets error");
    if ((err as Error).message === "Budget not found") {
      apiError(res, "NOT_FOUND", "Budget not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to update budget", 500);
  }
});

// DELETE /api/v1/budgets
router.delete("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.query.id as string;

    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Valid budget id is required", 400);
      return;
    }

    await deleteBudget(userId, id);
    apiSuccess(res, { deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/budgets error");
    if ((err as Error).message === "Budget not found") {
      apiError(res, "NOT_FOUND", "Budget not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to delete budget", 500);
  }
});

export default router;
