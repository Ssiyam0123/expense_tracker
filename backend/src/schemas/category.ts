import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  icon: z.string().max(5).optional(),
  color: z.string().max(7).optional(),
  type: z.enum(["income", "expense"]).default("expense"),
}).strict();

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  icon: z.string().max(5).optional(),
  color: z.string().max(7).optional(),
  type: z.enum(["income", "expense"]).optional(),
}).strict();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
