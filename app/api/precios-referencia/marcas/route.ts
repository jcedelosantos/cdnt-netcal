export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

// Marcas que tienen precios de referencia (para el selector de la cotización)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const filas = await withRetry(() =>
      prisma.precioReferencia.findMany({
        where: { userId, marca: { not: null } },
        distinct: ['marca'],
        orderBy: { marca: 'asc' },
        select: { marca: true },
      })
    );
    return NextResponse.json({ marcas: filas.map((f) => f.marca) });
  } catch {
    return NextResponse.json({ error: 'Error al obtener marcas' }, { status: 500 });
  }
}
