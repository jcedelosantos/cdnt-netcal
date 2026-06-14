export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;

    // Fetch RedCalc Projects
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { inventoryClient: true, materiales: true, pagos: true },
    });

    // Fetch Inventory data
    const [clients, equipment, licenses, consumptions] = await Promise.all([
      prisma.inventoryClient.findMany({ where: { userId } }),
      prisma.inventoryEquipment.findMany(),
      prisma.inventoryLicense.findMany(),
      prisma.inventoryMonthlyConsumption.findMany(),
    ]);

    // Calculate RedCalc metrics
    const redcalcMetrics = {
      totalProjects: projects.length,
      quotedProjects: projects.filter((p) => !p.aprobado).length,
      invoicedProjects: projects.filter((p) => p.numeroFactura).length,
      totalInvoiced: projects
        .filter((p) => p.numeroFactura)
        .reduce((sum, p) => {
          const materialsTotal = p.materiales?.reduce(
            (m: number, mat: any) => m + (mat.subtotal || 0),
            0
          ) || 0;
          return sum + materialsTotal;
        }, 0),
      totalMaterialsCost: projects.reduce((sum, p) => {
        return (
          sum +
          (p.materiales?.reduce((m: number, mat: any) => m + (mat.subtotal || 0), 0) || 0)
        );
      }, 0),
      pendingPayment: projects.filter(
        (p) => p.numeroFactura && p.estadoPago !== 'pagado'
      ).length,
    };

    // Calculate Inventory metrics
    const inventoryMetrics = {
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.activo).length,
      totalEquipment: equipment.length,
      activeEquipment: equipment.filter((e) => e.estado === 'activo').length,
      totalEquipmentCost: equipment.reduce(
        (sum, e) => sum + (e.costoUsd || 0),
        0
      ),
      totalLicenses: licenses.length,
      monthlyCost: consumptions.reduce(
        (sum, c) => sum + (c.costoMensual || 0),
        0
      ),
      annualCost: consumptions.reduce(
        (sum, c) => sum + (c.costoMensual || 0),
        0
      ) * 12,
    };

    // Create unified projects (with inventory info)
    const unifiedProjects = projects.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      cliente: p.cliente,
      estado: p.aprobado ? 'aprobado' : 'pendiente',
      numeroFactura: p.numeroFactura,
      estadoPago: p.estadoPago,
      inventoryClient: p.inventoryClient?.nombre,
      equipmentAsigned: equipment.filter(
        (e) => e.clientId === p.inventoryClientId
      ).length,
      materialsTotal: p.materiales?.reduce(
        (sum: number, mat: any) => sum + (mat.subtotal || 0),
        0
      ) || 0,
    }));

    return NextResponse.json({
      redcalc: redcalcMetrics,
      inventory: inventoryMetrics,
      projects: unifiedProjects,
      summary: {
        totalRevenue: redcalcMetrics.totalInvoiced,
        totalOperatingCosts: inventoryMetrics.annualCost,
        netProfit: redcalcMetrics.totalInvoiced - inventoryMetrics.annualCost,
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error al generar reporte unificado' },
      { status: 500 }
    );
  }
}
