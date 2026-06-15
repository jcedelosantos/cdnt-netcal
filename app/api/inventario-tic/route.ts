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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const where: any = { userId };
    if (clientId) where.clientId = clientId;

    const inventarios = await prisma.ticInventario.findMany({
      where,
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
    if (!userId) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

    const { clientId, clienteNombre, nombre, descripcion, fecha } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    }

    // Resolve clientId: use existing or create new client
    let resolvedClientId = clientId;
    if (!resolvedClientId && clienteNombre?.trim()) {
      const nuevoCliente = await prisma.inventoryClient.create({
        data: { userId, nombre: clienteNombre.trim(), activo: true },
      });
      resolvedClientId = nuevoCliente.id;
    }

    if (!resolvedClientId) {
      return NextResponse.json({ error: 'Cliente requerido' }, { status: 400 });
    }

    const inventario = await prisma.ticInventario.create({
      data: {
        userId,
        clientId: resolvedClientId,
        nombre,
        descripcion,
        fecha: fecha ? new Date(fecha) : null,
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
