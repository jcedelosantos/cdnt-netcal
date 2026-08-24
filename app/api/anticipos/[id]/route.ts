export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.anticipo.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const data = await request.json();
  const updated = await prisma.anticipo.update({
    where: { id: params.id },
    data: {
      fecha: data.fecha ? new Date(data.fecha) : existing.fecha,
      monto: data.monto !== undefined ? parseFloat(data.monto) : existing.monto,
      motivo: data.motivo !== undefined ? data.motivo : existing.motivo,
      metodoPago: data.metodoPago !== undefined ? data.metodoPago : existing.metodoPago,
      referencia: data.referencia !== undefined ? data.referencia : existing.referencia,
      autorizadoPor: data.autorizadoPor !== undefined ? data.autorizadoPor : existing.autorizadoPor,
      notas: data.notas !== undefined ? data.notas : existing.notas,
    },
    include: { tecnico: { select: { id: true, nombre: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.anticipo.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  await prisma.anticipo.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
