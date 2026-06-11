import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error'],
  });

  // Use middleware to handle connection errors transparently
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error: any) {
      const msg = error?.message ?? '';
      const isConnectionError =
        msg.includes('idle-session timeout') ||
        msg.includes('terminating connection') ||
        msg.includes('Connection refused') ||
        msg.includes('Can\'t reach database server') ||
        msg.includes('Connection timed out') ||
        msg.includes('prepared statement') ||
        error?.code === 'P1001' ||
        error?.code === 'P1002' ||
        error?.code === 'P1008' ||
        error?.code === 'P1017' ||
        error?.code === 'P2024';

      if (isConnectionError) {
        // Force disconnect to clear stale pool connections
        try { await client.$disconnect(); } catch {}
        await new Promise((r) => setTimeout(r, 300));
        try { await client.$connect(); } catch {}
        // Retry the operation once
        return await next(params);
      }
      throw error;
    }
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
