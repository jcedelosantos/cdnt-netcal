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
    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get('categoriaId');

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

    const articulos = await prisma.ticArticle.findMany({
      where: categoriaId ? { categoriaId } : { categoria: { inventarioId } },
      include: { categoria: true },
    });

    return NextResponse.json(articulos);
  } catch (error: any) {
    console.error('Error fetching articulos:', error);
    return NextResponse.json(
      { error: 'Error al obtener artículos' },
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
    const { categoriaId, nombre, cantidad, precioUnitario, descripcion, proveedor, fechaVencimiento } = await request.json();

    if (!categoriaId || !nombre) {
      return NextResponse.json(
        { error: 'categoriaId y nombre son requeridos' },
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

    // Calcular subtotal
    const qty = parseFloat(cantidad) || 1;
    const price = parseFloat(precioUnitario) || 0;
    const subtotal = qty * price;

    const articulo = await prisma.ticArticle.create({
      data: {
        categoriaId,
        nombre,
        cantidad: qty,
        precioUnitario: price,
        subtotal,
        descripcion,
        proveedor,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      },
      include: { categoria: true },
    });

    // Actualizar gastoTotal de la categoría
    await updateCategoriaGasto(categoriaId);
    // Actualizar gastoAnual del inventario
    await updateInventarioGasto(inventarioId);

    return NextResponse.json(articulo);
  } catch (error: any) {
    console.error('Error creating articulo:', error);
    return NextResponse.json(
      { error: 'Error al crear artículo' },
      { status: 500 }
    );
  }
}

// Helper functions
async function updateCategoriaGasto(categoriaId: string) {
  const articulos = await prisma.ticArticle.findMany({
    where: { categoriaId },
  });

  const gastoTotal = articulos.reduce((sum, art) => sum + (art.subtotal || 0), 0);

  await prisma.ticCategory.update({
    where: { id: categoriaId },
    data: { gastoTotal },
  });
}

async function updateInventarioGasto(inventarioId: string) {
  const categorias = await prisma.ticCategory.findMany({
    where: { inventarioId },
  });

  const gastoAnual = categorias.reduce((sum, cat) => sum + (cat.gastoTotal || 0), 0);

  await prisma.ticInventario.update({
    where: { id: inventarioId },
    data: { gastoAnual },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { articuloId, cantidad, precioUnitario, nombre } = await request.json();

    const articulo = await prisma.ticArticle.findUnique({
      where: { id: articuloId },
      include: { categoria: true },
    });

    if (!articulo) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    const qty = cantidad !== undefined ? parseFloat(cantidad) : articulo.cantidad;
    const price = precioUnitario !== undefined ? parseFloat(precioUnitario) : articulo.precioUnitario;
    const subtotal = qty * price;

    const updated = await prisma.ticArticle.update({
      where: { id: articuloId },
      data: {
        ...(nombre !== undefined && nombre.trim() ? { nombre: nombre.trim() } : {}),
        cantidad: qty,
        precioUnitario: price,
        subtotal,
      },
      include: { categoria: true },
    });

    // Actualizar gastos
    await updateCategoriaGasto(articulo.categoriaId);
    await updateInventarioGasto(params.id);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating articulo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar artículo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { articuloId } = await request.json();

    const articulo = await prisma.ticArticle.findUnique({
      where: { id: articuloId },
    });

    if (!articulo) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    await prisma.ticArticle.delete({
      where: { id: articuloId },
    });

    // Actualizar gastos
    await updateCategoriaGasto(articulo.categoriaId);
    await updateInventarioGasto(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting articulo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar artículo' },
      { status: 500 }
    );
  }
}
