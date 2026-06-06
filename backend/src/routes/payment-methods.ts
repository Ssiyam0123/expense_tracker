import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiSuccess, apiError } from "../utils/response";
import { logger } from "../utils/logger";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../services/payment-method";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "../schemas/payment-method";
import { isValidObjectId } from "../utils/validation";

const router = Router();
router.use(authenticate);

// GET /api/v1/payment-methods
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const methods = await getPaymentMethods(userId);
    apiSuccess(res, methods);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/payment-methods error");
    apiError(res, "INTERNAL", "Failed to fetch payment methods", 500);
  }
});

// POST /api/v1/payment-methods
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = createPaymentMethodSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const pm = await createPaymentMethod(userId, parsed.data);
    apiSuccess(res, pm);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/payment-methods error");
    if ((err as Error).message.includes("already exists")) {
      apiError(res, "CONFLICT", (err as Error).message, 409);
      return;
    }
    apiError(res, "INTERNAL", "Failed to create payment method", 500);
  }
});

// PATCH /api/v1/payment-methods
router.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, ...updates } = req.body;

    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Valid payment method ID is required", 400);
      return;
    }

    const parsed = updatePaymentMethodSchema.safeParse(updates);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const pm = await updatePaymentMethod(userId, id, parsed.data);
    apiSuccess(res, pm);
  } catch (err) {
    logger.error({ err }, "PATCH /api/v1/payment-methods error");
    if ((err as Error).message === "Payment method not found") {
      apiError(res, "NOT_FOUND", "Payment method not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to update payment method", 500);
  }
});

// DELETE /api/v1/payment-methods
router.delete("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.query.id as string;

    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Valid payment method ID is required", 400);
      return;
    }

    await deletePaymentMethod(userId, id);
    apiSuccess(res, { deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/payment-methods error");
    if ((err as Error).message === "Payment method not found") {
      apiError(res, "NOT_FOUND", "Payment method not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to delete payment method", 500);
  }
});

export default router;
