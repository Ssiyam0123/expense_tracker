import { NextRequest } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { apiSuccess, apiError } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  getPaymentMethods,
  createPaymentMethod,
} from "@/services/payment-method";
import { createPaymentMethodSchema } from "@/schemas/payment-method";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    const methods = await getPaymentMethods(userId);
    return apiSuccess(methods);
  } catch (err) {
    logger.error({ err }, "GET /api/v1/payment-methods error");
    return apiError("INTERNAL", "Failed to fetch payment methods", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const parsed = createPaymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION", "Invalid input", 400, parsed.error.flatten());
    }

    const pm = await createPaymentMethod(userId, parsed.data);
    return apiSuccess(pm);
  } catch (err) {
    logger.error({ err }, "POST /api/v1/payment-methods error");
    if ((err as Error).message.includes("already exists")) {
      return apiError("CONFLICT", (err as Error).message, 409);
    }
    return apiError("INTERNAL", "Failed to create payment method", 500);
  }
}
