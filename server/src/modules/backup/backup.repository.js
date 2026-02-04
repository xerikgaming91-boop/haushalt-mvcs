import { prisma } from "../../prisma/client.js";

export const backupRepository = {
  membership(householdId, userId) {
    return prisma.householdMember.findFirst({
      where: { householdId, userId }
    });
  },

  listHouseholdIdsForUser(userId) {
    return prisma.householdMember.findMany({
      where: { userId },
      select: { householdId: true }
    });
  },

  fetchHouseholdsByIds(ids) {
    return prisma.household.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
      include: {
        members: true,
        categories: true,
        tasks: { include: { occurrences: true } },
        shoppingItems: true,
        invites: true
      }
    });
  },

  existingUserIdsByIds(ids) {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    });
  },

  deleteHouseholdsByIds(ids) {
    // Cascades löschen Members/Categories/Tasks/Occurrences/Shopping/Invites über onDelete: Cascade
    return prisma.household.deleteMany({
      where: { id: { in: ids } }
    });
  }
};
