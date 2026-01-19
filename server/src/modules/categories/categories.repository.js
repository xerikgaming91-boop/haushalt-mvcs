import { prisma } from "../../prisma/client.js";

export const categoriesRepository = {
  membership(householdId, userId) {
    return prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } }
    });
  },
  list(householdId) {
    return prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } });
  },
  create(householdId, data) {
    return prisma.category.create({ data: { householdId, name: data.name, color: data.color } });
  }
};
