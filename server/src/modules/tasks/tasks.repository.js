import { prisma } from "../../prisma/client.js";

export const tasksRepository = {
  async assertMember(userId, householdId) {
    const member = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: { householdId, userId }
      }
    });
    return member;
  },

  listTasksForHousehold(householdId) {
    return prisma.task.findMany({
      where: { householdId },
      orderBy: [{ dueAt: "asc" }],
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } }
      }
    });
  },

  listOccurrenceStatuses(taskIds, from, to) {
    return prisma.taskOccurrence.findMany({
      where: {
        taskId: { in: taskIds },
        occurrenceAt: { gte: from, lte: to }
      },
      select: {
        taskId: true,
        occurrenceAt: true,
        status: true
      }
    });
  },

  createTask(data) {
    return prisma.task.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } }
      }
    });
  },

  setTaskStatus(taskId, status) {
    return prisma.task.update({
      where: { id: taskId },
      data: { status }
    });
  },

  upsertOccurrenceStatus(taskId, occurrenceAt, status) {
    return prisma.taskOccurrence.upsert({
      where: {
        taskId_occurrenceAt: { taskId, occurrenceAt }
      },
      create: { taskId, occurrenceAt, status },
      update: { status }
    });
  },

  deleteTask(taskId) {
    return prisma.task.delete({ where: { id: taskId } });
  }
};
