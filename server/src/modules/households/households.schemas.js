import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(120)
});

export const createInviteSchema = z.object({
  email: z.string().email().optional()
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1)
});
