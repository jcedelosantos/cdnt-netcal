export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { clientSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = { userId };
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
      ];
    }

    const items = await prisma.inventoryClient.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        equipment: { select: { id: true } },
        licenses: { select: { id: true } },
      },
    });

    return NextResponse.json(
      items.map((i) => ({
        ...i,
        equipmentCount: i.equipment.length,
        licenseCount: i.licenses.length,
      }))
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const body = await request.json();
    const validated = clientSchema.parse(body);

    const item = await prisma.inventoryClient.create({
      data: { ...validated, userId },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: error?.message || 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
