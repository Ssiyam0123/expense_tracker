import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiSuccess, apiError } from "../utils/response";
import { logger } from "../utils/logger";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category";
import { isValidObjectId } from "../utils/validation";

const router = Router();
router.use(authenticate);

// GET /api/v1/categories
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const categories = await getCategories(userId);
    apiSuccess(res, categories);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/categories error");
    apiError(res, "INTERNAL", "Failed to fetch categories", 500);
  }
});

// POST /api/v1/categories
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const category = await createCategory(userId, parsed.data);
    apiSuccess(res, category);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/categories error");
    if ((err as Error).message.includes("already exists")) {
      apiError(res, "CONFLICT", (err as Error).message, 409);
      return;
    }
    apiError(res, "INTERNAL", "Failed to create category", 500);
  }
});

// PATCH /api/v1/categories
router.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, ...updates } = req.body;

    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Valid category ID is required", 400);
      return;
    }

    const parsed = updateCategorySchema.safeParse(updates);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }

    const category = await updateCategory(userId, id, parsed.data);
    apiSuccess(res, category);
  } catch (err) {
    logger.error({ err }, "PATCH /api/v1/categories error");
    if ((err as Error).message === "Category not found") {
      apiError(res, "NOT_FOUND", "Category not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to update category", 500);
  }
});

// DELETE /api/v1/categories
router.delete("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.query.id as string;

    if (!id || typeof id !== "string" || !isValidObjectId(id)) {
      apiError(res, "VALIDATION", "Valid category ID is required", 400);
      return;
    }

    await deleteCategory(userId, id);
    apiSuccess(res, { deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/categories error");
    if ((err as Error).message === "Category not found") {
      apiError(res, "NOT_FOUND", "Category not found", 404);
      return;
    }
    apiError(res, "INTERNAL", "Failed to delete category", 500);
  }
});

export default router;
