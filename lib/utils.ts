import { v4 as uuidv4 } from "uuid";

/**
 * Generate a stable local ID (UUID v4) for offline-first transactions.
 */
export function generateLocalId(): string {
  return uuidv4();
}

/**
 * Convert a decimal money amount to integer minor units.
 * E.g., 150.75 BDT → 15075
 */
export function toMinorUnits(amount: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor);
}

/**
 * Convert integer minor units back to decimal.
 * E.g., 15075 → 150.75
 */
export function fromMinorUnits(amountMinor: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return amountMinor / factor;
}

/**
 * Standard API success response shape.
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json({ data, error: null, meta: meta || {} });
}

/**
 * Standard API error response shape.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
  meta?: Record<string, unknown>
) {
  return Response.json(
    { data: null, error: { code, message, details: details || null }, meta: meta || {} },
    { status }
  );
}
