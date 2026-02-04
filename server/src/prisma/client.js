import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    // log: ["query", "warn", "error"] // optional
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
