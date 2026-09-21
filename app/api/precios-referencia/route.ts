export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    const precios = await withRetry(() =>
      prisma.precioReferencia.findMany({
        where: {
          userId,
          ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
        },
        orderBy: [{ nombre: 'asc' }, { fecha: 'desc' }],
      })
    );

    return NextResponse.json({ precios });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al obtener precios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const body = await req.json();
    const { nombre, categoria, suplidor, precio, unidad, fuente, fecha, notas } = body;

    if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    if (!precio || isNaN(Number(precio))) return NextResponse.json({ error: 'El precio es requerido' }, { status: 400 });
    if (!fecha) return NextResponse.json({ error: 'La fecha es requerida' }, { status: 400 });

    const nuevo = await withRetry(() =>
      prisma.precioReferencia.create({
        data: {
          userId,
          nombre: nombre.trim(),
          categoria: categoria?.trim() || null,
          suplidor: suplidor?.trim() || null,
          precio: Number(precio),
          unidad: unidad || 'und',
          fuente: fuente || null,
          fecha: new Date(fecha),
          notas: notas?.trim() || null,
        },
      })
    );

    return NextResponse.json({ precio: nuevo });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al crear precio' }, { status: 500 });
  }
}
