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
