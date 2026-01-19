import { prisma } from "../../prisma/client.js";

export const passwordResetRepository = {
  findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  createToken({ userId, tokenHash, expiresAt }) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  },

  findValidTokenByHash(tokenHash) {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  },

  resetPasswordTransaction({ tokenId, userId, passwordHash }) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() }
      })
    ]);
  }
};
