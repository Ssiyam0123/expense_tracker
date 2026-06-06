import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1),
  amountMinor: z.number().int().min(1),
  currency: z.string().min(1).max(5).default("BDT"),
  period: z.enum(["monthly", "weekly", "yearly"]).default("monthly"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  alertThreshold: z.number().int().min(0).max(100).default(80),
}).strict();

export const updateBudgetSchema = z.object({
  amountMinor: z.number().int().min(1).optional(),
  alertThreshold: z.number().int().min(0).max(100).optional(),
}).strict();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
