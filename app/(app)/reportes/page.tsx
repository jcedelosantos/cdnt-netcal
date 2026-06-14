import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import Reporte607Client from './_components/reporte-607-client';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  let empresaNombre: string | undefined;
  try {
    const u = await withRetry(() =>
      prisma.user.findUnique({ where: { id: userId }, select: { empresaNombre: true } })
    );
    empresaNombre = u?.empresaNombre ?? undefined;
  } catch {}

  return <Reporte607Client empresaNombre={empresaNombre} />;
}
