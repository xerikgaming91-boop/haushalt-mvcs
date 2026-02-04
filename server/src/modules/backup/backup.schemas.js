import { z } from "zod";

export const downloadBackupQuerySchema = z.object({
  householdId: z.string().min(1).optional()
});

export const restoreBackupQuerySchema = z.object({
  mode: z.enum(["replace"]).default("replace")
});

export const restoreBackupBodySchema = z
  .object({
    version: z.number().int().min(1).optional().default(1),
    exportedAt: z.string().optional(),
    households: z.array(z.any()).default([])
  })
  .passthrough();
