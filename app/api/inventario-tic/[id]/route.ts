export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const inventarioId = params.id;

    const inventario = await prisma.ticInventario.findFirst({
      where: {
        id: inventarioId,
        userId: (session?.user as any)?.id,
      },
      include: {
        client: { select: { id: true, nombre: true } },
        categorias: { include: { articulos: true } },
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(inventario);
  } catch (error: any) {
    console.error('Error fetching inventario:', error);
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const inventarioId = params.id;
    const { nombre, descripcion, estado } = await request.json();

    const inventario = await prisma.ticInventario.findFirst({
      where: {
        id: inventarioId,
        userId: (session?.user as any)?.id,
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    const updated = await prisma.ticInventario.update({
      where: { id: inventarioId },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion && { descripcion }),
        ...(estado && { estado }),
      },
      include: {
        client: { select: { id: true, nombre: true } },
        categorias: { include: { articulos: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating inventario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inventario' },
      { status: 500 }
    );
  }
}
