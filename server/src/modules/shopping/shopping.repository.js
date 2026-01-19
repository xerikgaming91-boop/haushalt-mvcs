import { prisma } from "../../prisma/client.js";

export const shoppingRepository = {
  assertMember(userId, householdId) {
    return prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } }
    });
  },

  listItems(householdId, includePurchased = true) {
    return prisma.shoppingItem.findMany({
      where: {
        householdId,
        ...(includePurchased ? {} : { isPurchased: false })
      },
      orderBy: [{ isPurchased: "asc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        purchasedBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  createItem(data) {
    return prisma.shoppingItem.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        purchasedBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  findById(id) {
    return prisma.shoppingItem.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        purchasedBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  updateItem(id, data) {
    return prisma.shoppingItem.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        purchasedBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  deleteItem(id) {
    return prisma.shoppingItem.delete({ where: { id } });
  }
};
