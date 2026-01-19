import {
  createTaskSchema,
  listRangeSchema,
  setOccurrenceStatusSchema,
  setTaskStatusSchema
} from "./tasks.schemas.js";
import { tasksService } from "./tasks.service.js";
import { AppError } from "../../common/errors/AppError.js";

export const tasksController = {
  async listRange(req, res) {
    const parsed = listRangeSchema.safeParse(req.query);
    if (!parsed.success) throw new AppError("Invalid query", 400);

    const { householdId, from, to } = parsed.data;
    const result = await tasksService.listRange(req.user.id, householdId, from, to);
    return res.json(result);
  },

  async create(req, res) {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const task = await tasksService.createTask(req.user.id, parsed.data);
    return res.json({ task });
  },

  async setStatus(req, res) {
    const parsed = setTaskStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const { id } = req.params;
    const result = await tasksService.setTaskStatusSafe(req.user.id, id, parsed.data.status);
    return res.json(result);
  },

  async setOccurrenceStatus(req, res) {
    const parsed = setOccurrenceStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const { id } = req.params;
    const result = await tasksService.setOccurrenceStatus(
      req.user.id,
      id,
      parsed.data.occurrenceAt,
      parsed.data.status
    );
    return res.json(result);
  },

  async remove(req, res) {
    const { id } = req.params;
    const result = await tasksService.deleteTask(req.user.id, id);
    return res.json(result);
  }
};
