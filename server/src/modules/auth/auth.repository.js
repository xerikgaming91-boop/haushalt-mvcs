import { prisma } from "../../prisma/client.js";

export const authRepository = {
  findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true }
    });
  },

  createUser(data) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true }
    });
  }
};
