import { AppError } from "../../common/errors/AppError.js";
import { tasksRepository } from "./tasks.repository.js";
import { prisma } from "../../prisma/client.js";

function mapRecurrenceToDb(recurrence) {
  // Defaults
  if (!recurrence || recurrence.type === "NONE") {
    return {
      recurrenceType: "NONE",
      recurrenceInterval: 1,
      recurrenceUnit: null,
      recurrenceByWeekday: null,
      recurrenceByMonthday: null,
      recurrenceEndAt: null
    };
  }

  const recurrenceType = recurrence.type;
  const recurrenceInterval = recurrence.interval ?? 1;

  // Only meaningful for CUSTOM
  const recurrenceUnit = recurrenceType === "CUSTOM" ? (recurrence.unit || "DAY") : null;

  const recurrenceByWeekday = recurrence.byWeekday ? recurrence.byWeekday : null;
  const recurrenceByMonthday = recurrence.byMonthday ?? null;

  const recurrenceEndAt = recurrence.endAt ? new Date(recurrence.endAt) : null;

  return {
    recurrenceType,
    recurrenceInterval,
    recurrenceUnit,
    recurrenceByWeekday,
    recurrenceByMonthday,
    recurrenceEndAt
  };
}

export const tasksService = {
  async listRange(userId, householdId, fromIso, toIso) {
    const member = await tasksRepository.assertMember(userId, householdId);
    if (!member) throw new AppError("Not allowed", 403);

    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new AppError("Invalid date range", 400);
    }

    const tasks = await tasksRepository.listTasksForHousehold(householdId);
    const taskIds = tasks.map((t) => t.id);

    const occurrenceStatuses =
      taskIds.length === 0 ? [] : await tasksRepository.listOccurrenceStatuses(taskIds, from, to);

    return { tasks, occurrenceStatuses };
  },

  async createTask(userId, dto) {
    const member = await tasksRepository.assertMember(userId, dto.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    const recurrenceDb = mapRecurrenceToDb(dto.recurrence);

    const task = await tasksRepository.createTask({
      householdId: dto.householdId,
      title: dto.title,
      description: dto.description || null,
      dueAt: new Date(dto.dueAt),
      allDay: Boolean(dto.allDay),
      status: "OPEN",
      assignedToId: dto.assignedToId || null,
      categoryId: dto.categoryId || null,
      createdById: userId,
      ...recurrenceDb
    });

    return task;
  },

  // Controller nutzt aktuell setTaskStatusSafe(...)
  async setTaskStatusSafe(userId, taskId, status) {
    const t = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, householdId: true, recurrenceType: true }
    });
    if (!t) throw new AppError("Task not found", 404);

    const member = await tasksRepository.assertMember(userId, t.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    // Non-recurring tasks only via /status
    if (t.recurrenceType !== "NONE") {
      throw new AppError("Use occurrence endpoint for recurring tasks", 400);
    }

    await tasksRepository.setTaskStatus(taskId, status);
    return { ok: true };
  },

  // Optional: Alias, falls irgendwo noch setTaskStatus(...) direkt genutzt wird
  async setTaskStatus(userId, taskId, status) {
    return this.setTaskStatusSafe(userId, taskId, status);
  },

  async setOccurrenceStatus(userId, taskId, occurrenceAtIso, status) {
    const t = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, householdId: true, recurrenceType: true }
    });
    if (!t) throw new AppError("Task not found", 404);

    const member = await tasksRepository.assertMember(userId, t.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    // Für non-recurring interpretieren wir occurrence wie task-status
    if (t.recurrenceType === "NONE") {
      await tasksRepository.setTaskStatus(taskId, status);
      return { ok: true };
    }

    const occurrenceAt = new Date(occurrenceAtIso);
    if (Number.isNaN(occurrenceAt.getTime())) {
      throw new AppError("Invalid occurrenceAt", 400);
    }

    await tasksRepository.upsertOccurrenceStatus(taskId, occurrenceAt, status);
    return { ok: true };
  },

  async deleteTask(userId, taskId) {
    const t = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, householdId: true }
    });
    if (!t) throw new AppError("Task not found", 404);

    const member = await tasksRepository.assertMember(userId, t.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    await tasksRepository.deleteTask(taskId);
    return { ok: true };
  }
};
