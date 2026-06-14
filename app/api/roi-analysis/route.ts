export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Fetch projects with pagos
    const projects = await prisma.project.findMany({
      where: {
        userId,
        ...(status !== 'all' && { estadoPago: status }),
      },
      include: {
        pagos: true,
      },
    });

    // Calculate ROI metrics for each project
    const roiProjects = projects
      .map((project) => {
        const revenue = project.pagos.reduce((sum, pago) => sum + pago.monto, 0);
        const costs = project.margenGanancia || 0; // Use presupuesto estimate (we can enhance this)
        const profit = revenue - costs;
        const roiPercent = costs > 0 ? (profit / costs) * 100 : (revenue > 0 ? 100 : 0);
        const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;
        const daysActive = differenceInDays(new Date(), project.createdAt);

        return {
          id: project.id,
          nombre: project.nombre,
          cliente: project.cliente,
          estado: project.estadoPago,
          revenue,
          costs,
          profit,
          roiPercent: Math.round(roiPercent * 100) / 100,
          marginPercent: Math.round(marginPercent * 100) / 100,
          daysActive,
          createdAt: project.createdAt,
          facturadoEn: project.facturadoEn,
        };
      })
      .sort((a, b) => b.roiPercent - a.roiPercent);

    // Calculate summary metrics
    const summary = {
      totalProjects: roiProjects.length,
      totalRevenue: Math.round(roiProjects.reduce((sum, p) => sum + p.revenue, 0) * 100) / 100,
      totalCosts: Math.round(roiProjects.reduce((sum, p) => sum + p.costs, 0) * 100) / 100,
      totalProfit: Math.round(roiProjects.reduce((sum, p) => sum + p.profit, 0) * 100) / 100,
      avgRoi:
        roiProjects.length > 0
          ? Math.round(
              (roiProjects.reduce((sum, p) => sum + p.roiPercent, 0) / roiProjects.length) * 100
            ) / 100
          : 0,
      avgMargin:
        roiProjects.length > 0
          ? Math.round(
              (roiProjects.reduce((sum, p) => sum + p.marginPercent, 0) / roiProjects.length) * 100
            ) / 100
          : 0,
      profitableProjects: roiProjects.filter((p) => p.profit > 0).length,
      lossProjects: roiProjects.filter((p) => p.profit < 0).length,
    };

    return NextResponse.json({
      projects: roiProjects,
      summary,
    });
  } catch (error: any) {
    console.error('Error calculating ROI:', error);
    return NextResponse.json(
      { error: 'Error al calcular ROI' },
      { status: 500 }
    );
  }
}
