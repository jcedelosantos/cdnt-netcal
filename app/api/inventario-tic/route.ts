export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;

    const inventarios = await prisma.ticInventario.findMany({
      where: { userId },
      include: {
        client: {
          select: { id: true, nombre: true },
        },
        categorias: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Enriquecer con conteo de categorías
    const result = inventarios.map((inv) => ({
      id: inv.id,
      nombre: inv.nombre,
      cliente: inv.client,
      gastoAnual: inv.gastoAnual,
      categorias: inv.categorias.length,
      estado: inv.estado,
      updatedAt: inv.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching inventarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener inventarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const { clientId, nombre, descripcion } = await request.json();

    if (!clientId || !nombre) {
      return NextResponse.json(
        { error: 'clientId y nombre son requeridos' },
        { status: 400 }
      );
    }

    const inventario = await prisma.ticInventario.create({
      data: {
        userId,
        clientId,
        nombre,
        descripcion,
        estado: 'borrador',
      },
      include: {
        client: { select: { id: true, nombre: true } },
        categorias: true,
      },
    });

    return NextResponse.json(inventario);
  } catch (error: any) {
    console.error('Error creating inventario:', error);
    return NextResponse.json(
      { error: 'Error al crear inventario' },
      { status: 500 }
    );
  }
}
