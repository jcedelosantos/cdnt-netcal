export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { calcularEstadoPago } from '@/lib/numeracion';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const project = await withRetry(() => prisma.project.findFirst({ where: { id, userId } }));
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const body = await req.json();
    const { concepto, monto, fecha, metodoPago, referencia } = body ?? {};

    if (!monto || parseFloat(monto) <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a cero' }, { status: 400 });
    }

    const pago = await prisma.pago.create({
      data: {
        projectId: id,
        concepto: concepto?.trim() || 'Pago',
        monto: parseFloat(monto),
        fecha: fecha ? new Date(fecha) : new Date(),
        metodoPago: metodoPago?.trim() || null,
        referencia: referencia?.trim() || null,
      },
    });

    // Recalcular estado de pago
    const pagos = await prisma.pago.findMany({ where: { projectId: id } });
    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
    const totalMateriales = await prisma.projectMaterial.aggregate({
      where: { projectId: id },
      _sum: { subtotal: true },
    });
    const totalCotizado = totalMateriales._sum.subtotal ?? 0;
    const estadoPago = calcularEstadoPago(totalCotizado, totalPagado);
    await prisma.project.update({ where: { id }, data: { estadoPago } });

    return NextResponse.json({ success: true, pago, estadoPago });
  } catch (error: any) {
    console.error('POST pago error:', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}
