export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const body = await req.json();
    const { nombre, categoria, suplidor, precio, unidad, fuente, fecha, notas } = body;

    const existing = await withRetry(() => prisma.precioReferencia.findFirst({ where: { id: params.id, userId } }));
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const updated = await withRetry(() =>
      prisma.precioReferencia.update({
        where: { id: params.id },
        data: {
          nombre: nombre?.trim() ?? existing.nombre,
          categoria: categoria?.trim() || null,
          suplidor: suplidor?.trim() || null,
          precio: precio !== undefined ? Number(precio) : existing.precio,
          unidad: unidad || existing.unidad,
          fuente: fuente || null,
          fecha: fecha ? new Date(fecha) : existing.fecha,
          notas: notas?.trim() || null,
        },
      })
    );

    return NextResponse.json({ precio: updated });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al actualizar precio' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const existing = await withRetry(() => prisma.precioReferencia.findFirst({ where: { id: params.id, userId } }));
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    await withRetry(() => prisma.precioReferencia.delete({ where: { id: params.id } }));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al eliminar precio' }, { status: 500 });
  }
}
