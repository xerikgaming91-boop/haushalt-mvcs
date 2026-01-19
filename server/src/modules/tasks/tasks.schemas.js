import { z } from "zod";

const recurrenceSchema = z
  .object({
    type: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).default("NONE"),
    interval: z.number().int().min(1).max(365).default(1),
    unit: z.enum(["DAY", "WEEK", "MONTH"]).optional(),
    byWeekday: z.array(z.number().int().min(0).max(6)).optional(), // 0=Mo ... 6=So
    byMonthday: z.number().int().min(1).max(31).optional(),
    endAt: z.string().datetime().optional().nullable()
  })
  .optional();

export const createTaskSchema = z.object({
  householdId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.string().datetime(),
  allDay: z.boolean().optional().default(false),
  assignedToId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  recurrence: recurrenceSchema
});

export const listRangeSchema = z.object({
  householdId: z.string().min(1),
  from: z.string().datetime(),
  to: z.string().datetime()
});

export const setTaskStatusSchema = z.object({
  status: z.enum(["OPEN", "DONE"])
});

export const setOccurrenceStatusSchema = z.object({
  occurrenceAt: z.string().datetime(),
  status: z.enum(["OPEN", "DONE"])
});
