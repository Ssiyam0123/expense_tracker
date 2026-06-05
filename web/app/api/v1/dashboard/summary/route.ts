import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getDashboardSummary } from "@/services/dashboard";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const url = new URL(req.url);
    const now = new Date();
    const month = parseInt(url.searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(url.searchParams.get("year") || String(now.getFullYear()), 10);

    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return apiError("VALIDATION", "Invalid month or year", 400);
    }

    const summary = await getDashboardSummary(userId, month, year);
    return apiSuccess(summary);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/dashboard/summary error");
    return apiError("INTERNAL", "Failed to fetch dashboard summary", 500);
  }
}
