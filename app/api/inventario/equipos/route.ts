export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { equipmentSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tipo = searchParams.get('tipo') || '';
    const estado = searchParams.get('estado') || '';
    const clientId = searchParams.get('clientId') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { direccionIp: { contains: search } },
        { fabricante: { contains: search, mode: 'insensitive' } },
        { numeroSerie: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tipo) where.tipoEquipo = tipo;
    if (estado) where.estado = estado;
    if (clientId) where.clientId = clientId;

    const items = await prisma.inventoryEquipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error al obtener equipos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const validated = equipmentSchema.parse(body);
    const item = await prisma.inventoryEquipment.create({ data: validated });
    return NextResponse.json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: error?.message || 'Error al crear equipo' },
      { status: 500 }
    );
  }
}
