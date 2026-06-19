import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import DashboardClient from './_components/dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  let stats = { total: 0, facturados: 0, aprobados: 0, pendientes: 0 };
  let recentProjects: any[] = [];
  let recentInventarios: any[] = [];

  try {
    const total = await withRetry(() => prisma.project.count({ where: { userId } }));
    const facturados = await withRetry(() => prisma.project.count({
      where: { userId, numeroFactura: { not: null } },
    }));
    const aprobados = await withRetry(() => prisma.project.count({
      where: { userId, aprobado: true },
    }));
    stats = { total, facturados, aprobados, pendientes: total - aprobados };

    const projects = await withRetry(() => prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { puntos: true },
    }));
    recentProjects = projects.map((p: any) => ({
      id: p?.id,
      nombre: p?.nombre,
      cliente: p?.cliente,
      fecha: p?.fecha?.toISOString(),
      updatedAt: p?.updatedAt?.toISOString(),
      categoriaCable: p?.categoriaCable,
      aprobado: p?.aprobado ?? false,
      totalPuntos: (p?.puntos ?? []).reduce((acc: number, pt: any) => acc + (pt?.cantidad ?? 0), 0),
    }));

    const inventarios = await withRetry(() => (prisma as any).ticInventario.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: {
        client: { select: { nombre: true } },
        categorias: { select: { id: true } },
      },
    }));
    recentInventarios = (inventarios ?? []).map((inv: any) => ({
      id: inv.id,
      nombre: inv.nombre,
      cliente: inv.client?.nombre ?? '',
      gastoAnual: inv.gastoAnual ?? 0,
      categorias: inv.categorias?.length ?? 0,
      estado: inv.estado,
      updatedAt: inv.updatedAt?.toISOString(),
    }));
  } catch (e: any) {
    console.error('Dashboard error:', e);
  }

  return (
    <DashboardClient
      stats={stats}
      recentProjects={recentProjects}
      recentInventarios={recentInventarios}
      userName={session?.user?.name ?? 'Usuario'}
    />
  );
}
