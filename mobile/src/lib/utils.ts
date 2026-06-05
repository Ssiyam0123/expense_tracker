/**
 * Convert a decimal money amount to integer minor units (paisa).
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
 * Format minor units as a currency string.
 * E.g., 15075 → "1,507.50"
 */
export function formatCurrency(
  amountMinor: number,
  currency = "BDT",
  decimals = 2
): string {
  const value = fromMinorUnits(amountMinor, decimals);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format minor units as a compact currency string.
 * E.g., 150000 → "1,500" (for BDT, typically no decimals for large amounts)
 */
export function formatCurrencyCompact(amountMinor: number): string {
  const value = fromMinorUnits(amountMinor);
  if (value >= 1000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse a decimal string or number and convert to minor units.
 */
export function parseToMinorUnits(value: string | number, decimals = 2): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return toMinorUnits(num, decimals);
}

/**
 * Get the current month (1-12) and year.
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * Format an ISO date string to a human-readable date.
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Generate a simple UUID v4-like ID for local use.
 * Uses crypto.randomUUID() when available.
 */
export function generateLocalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
