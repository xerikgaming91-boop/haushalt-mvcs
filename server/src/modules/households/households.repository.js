import { prisma } from "../../prisma/client.js";

export const householdsRepository = {
  listForUser(userId) {
    return prisma.household.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });
  },

  createHouseholdWithAdminMember({ name, createdById }) {
    return prisma.household.create({
      data: {
        name,
        createdById,
        members: { create: { userId: createdById, role: "ADMIN" } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });
  },

  findMembership({ householdId, userId }) {
    return prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } }
    });
  },

  createInvite({ householdId, token, email, expiresAt }) {
    return prisma.invite.create({ data: { householdId, token, email, expiresAt } });
  },

  findInviteByToken(token) {
    return prisma.invite.findUnique({ where: { token } });
  },

  markInviteAccepted({ inviteId, userId }) {
    return prisma.invite.update({
      where: { id: inviteId },
      data: { acceptedAt: new Date(), acceptedById: userId }
    });
  },

  listMembers(householdId) {
    return prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" }
    });
  },

  acceptInviteTransaction({ inviteId, householdId, userId }) {
    return prisma.$transaction([
      prisma.householdMember.create({ data: { householdId, userId, role: "MEMBER" } }),
      prisma.invite.update({ where: { id: inviteId }, data: { acceptedAt: new Date(), acceptedById: userId } })
    ]);
  }
};
