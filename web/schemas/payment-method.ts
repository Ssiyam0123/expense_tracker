import { z } from "zod";

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  icon: z.string().max(5).optional(),
}).strict();

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  icon: z.string().max(5).optional(),
}).strict();

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
