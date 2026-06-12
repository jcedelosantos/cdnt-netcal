export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { calcularEstadoPago } from '@/lib/numeracion';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; pagoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const project = await prisma.project.findFirst({ where: { id: params.id, userId } });
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const pago = await prisma.pago.findFirst({ where: { id: params.pagoId, projectId: params.id } });
    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });

    await prisma.pago.delete({ where: { id: params.pagoId } });

    // Recalcular estado de pago
    const pagos = await prisma.pago.findMany({ where: { projectId: params.id } });
    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
    const totalMateriales = await prisma.projectMaterial.aggregate({
      where: { projectId: params.id },
      _sum: { subtotal: true },
    });
    const totalCotizado = totalMateriales._sum.subtotal ?? 0;
    const estadoPago = calcularEstadoPago(totalCotizado, totalPagado);
    await prisma.project.update({ where: { id: params.id }, data: { estadoPago } });

    return NextResponse.json({ success: true, estadoPago });
  } catch (error: any) {
    console.error('DELETE pago error:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}
