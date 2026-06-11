import { prisma } from '@/lib/prisma';

/**
 * Wrapper that retries a Prisma operation once if the connection was dropped
 * due to idle-session timeout or similar transient errors.
 * Note: The Prisma middleware in lib/prisma.ts handles most cases automatically,
 * but this wrapper provides an extra safety net for complex multi-query operations.
 */
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const message = error?.message ?? '';
    const isConnectionError =
      message.includes('idle-session timeout') ||
      message.includes('terminating connection') ||
      message.includes('Connection refused') ||
      message.includes('Can\'t reach database server') ||
      message.includes('Connection timed out') ||
      message.includes('prepared statement') ||
      error?.code === 'P1001' ||
      error?.code === 'P1002' ||
      error?.code === 'P1008' ||
      error?.code === 'P1017' ||
      error?.code === 'P2024';

    if (isConnectionError) {
      try {
        await prisma.$disconnect();
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        await prisma.$connect();
      } catch {}
      return await operation();
    }
    throw error;
  }
}
