import { z } from "zod";

export const createTransactionSchema = z.object({
  amountMinor: z.number().int().min(0),
  currency: z.string().min(1).max(5).default("BDT"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  timestamp: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  localId: z.string().uuid().optional(),
  sourceDeviceId: z.string().max(100).optional(),
}).strict().refine(
  (data) => {
    // Only require localId and sourceDeviceId together
    if (data.localId || data.sourceDeviceId) {
      return data.localId && data.sourceDeviceId;
    }
    return true;
  },
  { message: "localId and sourceDeviceId must be provided together" }
);

export const syncTransactionSchema = z.object({
  transactions: z.array(z.object({
    amountMinor: z.number().int().min(0),
    currency: z.string().min(1).max(5).default("BDT"),
    type: z.enum(["income", "expense"]),
    categoryId: z.string().min(1),
    paymentMethodId: z.string().min(1),
    timestamp: z.string().datetime(),
    note: z.string().max(500).nullable().optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    localId: z.string().min(1),
    sourceDeviceId: z.string().min(1),
    version: z.number().int().min(1).default(1),
    deletedAt: z.string().datetime().nullable().optional(),
    idempotencyKey: z.string().uuid(),
  })).max(100),
}).strict();

export const updateTransactionSchema = z.object({
  amountMinor: z.number().int().min(0).optional(),
  currency: z.string().min(1).max(5).optional(),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().min(1).optional(),
  paymentMethodId: z.string().min(1).optional(),
  timestamp: z.string().datetime().optional(),
  note: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
}).strict();

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["timestamp", "amountMinor", "createdAt"]).default("timestamp"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type SyncTransactionInput = z.infer<typeof syncTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
