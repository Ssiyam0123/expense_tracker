import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getCategories, createCategory } from "@/services/category";
import { createCategorySchema } from "@/schemas/category";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    const categories = await getCategories(userId);
    return apiSuccess(categories);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/categories error");
    return apiError("INTERNAL", "Failed to fetch categories", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const category = await createCategory(userId, parsed.data);
    return apiSuccess(category);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/categories error");
    if ((err as Error).message.includes("already exists")) {
      return apiError("CONFLICT", (err as Error).message, 409);
    }
    return apiError("INTERNAL", "Failed to create category", 500);
  }
}
