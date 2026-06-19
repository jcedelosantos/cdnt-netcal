export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const roles = await prisma.tecnicoRol.findMany({
    where: { userId },
    orderBy: { nombre: 'asc' },
  });
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const data = await request.json();
  const rol = await prisma.tecnicoRol.create({
    data: {
      userId,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      tarifaDiaria: parseFloat(data.tarifaDiaria) || 0,
      color: data.color || '#3B82F6',
    },
  });
  return NextResponse.json(rol);
}
