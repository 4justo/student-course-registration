import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Reuse a single PrismaClient across the app instead of letting every
// repository spin up its own connection pool.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
