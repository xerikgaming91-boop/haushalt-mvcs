import { z } from "zod";

export const listShoppingSchema = z.object({
  householdId: z.string().min(1),
  includePurchased: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
});

export const createShoppingItemSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1).max(200),
  quantity: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable()
});

export const updateShoppingItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  isPurchased: z.boolean().optional()
});
