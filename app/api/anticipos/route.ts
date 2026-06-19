export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const tecnicoId = searchParams.get('tecnicoId');
  const estado = searchParams.get('estado');

  const anticipos = await prisma.anticipo.findMany({
    where: {
      userId,
      ...(tecnicoId ? { tecnicoId } : {}),
      ...(estado ? { estado } : {}),
    },
    include: { tecnico: { select: { id: true, nombre: true } } },
    orderBy: { fecha: 'desc' },
  });

  return NextResponse.json(anticipos);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const data = await request.json();
    const anticipo = await prisma.anticipo.create({
      data: {
        userId,
        tecnicoId: data.tecnicoId,
        projectId: data.projectId || null,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        monto: parseFloat(data.monto),
        motivo: data.motivo || null,
        metodoPago: data.metodoPago || null,
        referencia: data.referencia || null,
        autorizadoPor: data.autorizadoPor || null,
        notas: data.notas || null,
        estado: 'pendiente',
      },
      include: { tecnico: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json(anticipo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar anticipo' }, { status: 500 });
  }
}
