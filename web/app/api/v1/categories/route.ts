import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getCategories, createCategory, deleteCategory } from "@/services/category";
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

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError("VALIDATION", "Category ID is required", 400);
    }

    await deleteCategory(userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/v1/categories error");
    if ((err as Error).message === "Category not found") {
      return apiError("NOT_FOUND", "Category not found", 404);
    }
    return apiError("INTERNAL", "Failed to delete category", 500);
  }
}
