import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/services/budget";
import {
  createBudgetSchema,
  updateBudgetSchema,
  listBudgetsSchema,
} from "@/schemas/budget";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const parsed = listBudgetsSchema.safeParse(query);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid query", 400, parsed.error.flatten());
    }

    const budgets = await getBudgets(userId, parsed.data.month, parsed.data.year);
    return apiSuccess(budgets);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/budgets error");
    return apiError("INTERNAL", "Failed to fetch budgets", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const parsed = createBudgetSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const budget = await createBudget(userId, parsed.data);
    return apiSuccess(budget);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/budgets error");
    if ((err as Error).message.includes("already exists")) {
      return apiError("CONFLICT", (err as Error).message, 409);
    }
    return apiError("INTERNAL", "Failed to create budget", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return apiError("VALIDATION", "Budget id is required", 400);
    }

    const parsed = updateBudgetSchema.safeParse(updates);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const budget = await updateBudget(userId, id as string, parsed.data);
    return apiSuccess(budget);
  } catch (err) {
    logger.error({ err }, "PATCH /api/v1/budgets error");
    if ((err as Error).message === "Budget not found") {
      return apiError("NOT_FOUND", "Budget not found", 404);
    }
    return apiError("INTERNAL", "Failed to update budget", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return apiError("VALIDATION", "Budget id is required", 400);
    }

    await deleteBudget(userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/budgets error");
    if ((err as Error).message === "Budget not found") {
      return apiError("NOT_FOUND", "Budget not found", 404);
    }
    return apiError("INTERNAL", "Failed to delete budget", 500);
  }
}
