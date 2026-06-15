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

    // Verificar que el inventario pertenece al usuario
    const inventario = await prisma.ticInventario.findFirst({
      where: {
        id: inventarioId,
        userId: (session?.user as any)?.id,
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    const categorias = await prisma.ticCategory.findMany({
      where: { inventarioId },
      include: { articulos: true },
      orderBy: { orden: 'asc' },
    });

    return NextResponse.json(categorias);
  } catch (error: any) {
    console.error('Error fetching categorias:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const inventarioId = params.id;
    const { nombre, descripcion } = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el inventario pertenece al usuario
    const inventario = await prisma.ticInventario.findFirst({
      where: {
        id: inventarioId,
        userId: (session?.user as any)?.id,
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    const categoria = await prisma.ticCategory.create({
      data: {
        inventarioId,
        nombre,
        descripcion,
        orden: 0,
      },
    });

    return NextResponse.json(categoria);
  } catch (error: any) {
    console.error('Error creating categoria:', error);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
