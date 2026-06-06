import { Response } from "express";

/**
 * Standard API success response shape.
 */
export function apiSuccess<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  return res.json({ data, error: null, meta: meta || {} });
}

/**
 * Standard API error response shape.
 */
export function apiError(
  res: Response,
  code: string,
  message: string,
  status: number,
  details?: unknown,
  meta?: Record<string, unknown>
) {
  return res.status(status).json({
    data: null,
    error: { code, message, details: details || null },
    meta: meta || {},
  });
}
