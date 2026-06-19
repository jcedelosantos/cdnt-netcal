export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const periodo = await prisma.periodoPago.findFirst({
    where: { id: params.id, userId },
    include: {
      detalles: true,
      jornadas: {
        include: {
          tecnico: { select: { id: true, nombre: true, cedula: true } },
          project: { select: { id: true, nombre: true, cliente: true } },
        },
        orderBy: { fecha: 'asc' },
      },
      recibos: { include: { tecnico: { select: { id: true, nombre: true } } } },
    },
  });
  if (!periodo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(periodo);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const data = await request.json();
  const existing = await prisma.periodoPago.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const updated = await prisma.periodoPago.update({
    where: { id: params.id },
    data: {
      estado: data.estado ?? existing.estado,
      fechaPago: data.fechaPago ? new Date(data.fechaPago) : existing.fechaPago,
      metodoPago: data.metodoPago ?? existing.metodoPago,
      referencia: data.referencia ?? existing.referencia,
      aprobadoPor: data.aprobadoPor ?? existing.aprobadoPor,
      notas: data.notas ?? existing.notas,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.periodoPago.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (['aprobado', 'pagado'].includes(existing.estado)) {
    return NextResponse.json({ error: 'No se puede eliminar un periodo aprobado o pagado' }, { status: 400 });
  }

  // Unlink jornadas
  await prisma.jornada.updateMany({ where: { periodoPagoId: params.id }, data: { periodoPagoId: null } });
  // Restore anticipos
  await prisma.anticipo.updateMany({ where: { periodoPagoId: params.id }, data: { estado: 'pendiente', periodoPagoId: null } });
  await prisma.periodoPago.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
