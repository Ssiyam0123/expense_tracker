import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { apiError } from "../utils/response";
import { logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware that verifies JWT from Authorization header (Bearer token).
 * Also supports a base64-encoded JSON token in x-user-id header for mobile compatibility.
 * The x-user-id format must be: base64({ userId, exp }) where exp > Date.now().
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // 1. Check Authorization header (Bearer token) - primary method
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
      return;
    } catch (err) {
      apiError(res, "UNAUTHORIZED", "Invalid or expired token", 401);
      return;
    }
  }

  // 2. Fallback: verify custom x-user-id header for mobile compatibility
  // Expects base64-encoded JSON: { userId: string, exp: number }
  const xUserId = req.headers["x-user-id"] as string | undefined;
  if (xUserId) {
    try {
      const decoded = Buffer.from(xUserId, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (
        parsed.userId &&
        typeof parsed.userId === "string" &&
        parsed.exp &&
        typeof parsed.exp === "number" &&
        parsed.exp > Date.now()
      ) {
        req.user = { userId: parsed.userId, email: "" };
        next();
        return;
      }
      logger.warn({ xUserId: xUserId.substring(0, 20) }, "Invalid or expired x-user-id token");
      apiError(res, "UNAUTHORIZED", "Invalid or expired mobile token", 401);
      return;
    } catch {
      logger.warn("Failed to parse x-user-id header");
      apiError(res, "UNAUTHORIZED", "Invalid mobile token format", 401);
      return;
    }
  }

  apiError(res, "UNAUTHORIZED", "Authentication required", 401);
}
