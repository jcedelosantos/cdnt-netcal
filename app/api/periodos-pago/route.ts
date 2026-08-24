export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const periodos = await prisma.periodoPago.findMany({
    where: { userId },
    include: {
      detalles: true,
      _count: { select: { jornadas: true } },
      jornadas: {
        include: {
          tecnico: { select: { id: true, nombre: true, codigo: true } },
          project: { select: { id: true, nombre: true, cliente: true } },
        },
      },
    },
    orderBy: { fechaInicio: 'desc' },
  });

  return NextResponse.json(periodos);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const data = await request.json();
    const periodo = await prisma.periodoPago.create({
      data: {
        userId,
        nombre: data.nombre,
        tipo: data.tipo || 'semanal',
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        notas: data.notas || null,
      },
    });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear periodo' }, { status: 500 });
  }
}
