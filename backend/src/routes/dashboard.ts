import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiSuccess, apiError } from "../utils/response";
import { logger } from "../utils/logger";
import { getDashboardSummary } from "../services/dashboard";

const router = Router();
router.use(authenticate);

// GET /api/v1/dashboard/summary
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = Math.max(1, Math.min(12, parseInt((req.query.month as string) || String(now.getMonth() + 1), 10)));
    const year = Math.max(2020, Math.min(2100, parseInt((req.query.year as string) || String(now.getFullYear()), 10)));

    if (isNaN(month) || isNaN(year)) {
      apiError(res, "VALIDATION", "Invalid month or year", 400);
      return;
    }

    const summary = await getDashboardSummary(userId, month, year);
    apiSuccess(res, summary);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/dashboard/summary error");
    apiError(res, "INTERNAL", "Failed to fetch dashboard summary", 500);
  }
});

export default router;
