export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST /api/periodos-pago/[id]/revertir
// Revierte el cierre: deslinka jornadas, borra detalles/recibos,
// reactiva anticipos aplicados y vuelve el período a borrador.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const periodo = await prisma.periodoPago.findFirst({ where: { id: params.id, userId } });
  if (!periodo) return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 });
  if (periodo.estado === 'borrador') {
    return NextResponse.json({ error: 'El período ya está en borrador' }, { status: 400 });
  }

  try {
    // 1. Deslinkar jornadas (periodoPagoId → null)
    const { count: jornadasLiberadas } = await prisma.jornada.updateMany({
      where: { periodoPagoId: params.id, userId },
      data: { periodoPagoId: null },
    });

    // 2. Revertir anticipos aplicados a este período → pendiente
    await prisma.anticipo.updateMany({
      where: { periodoPagoId: params.id, userId },
      data: { estado: 'pendiente', periodoPagoId: null },
    });

    // 3. Borrar recibos del período
    await prisma.recibo.deleteMany({ where: { periodoPagoId: params.id, userId } });

    // 4. Borrar detalles de pago
    await prisma.detallePago.deleteMany({ where: { periodoPagoId: params.id, userId } });

    // 5. Resetear totales y estado del período
    await prisma.periodoPago.update({
      where: { id: params.id },
      data: {
        estado: 'borrador',
        totalBruto: 0,
        totalAnticipos: 0,
        totalDescuentos: 0,
        totalNeto: 0,
      },
    });

    return NextResponse.json({
      success: true,
      jornadasLiberadas,
      message: 'Cierre revertido. El período volvió a borrador y puede procesarse nuevamente.',
    });
  } catch (error: any) {
    console.error('Error al revertir cierre:', error);
    return NextResponse.json({ error: 'Error al revertir el cierre' }, { status: 500 });
  }
}
