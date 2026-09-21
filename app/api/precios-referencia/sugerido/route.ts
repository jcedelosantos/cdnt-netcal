export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

// Devuelve el precio más reciente para un nombre de producto
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ sugerido: null });
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const nombre = searchParams.get('nombre')?.trim();
    if (!nombre) return NextResponse.json({ sugerido: null });

    const precio = await withRetry(() =>
      prisma.precioReferencia.findFirst({
        where: {
          userId,
          nombre: { contains: nombre, mode: 'insensitive' },
        },
        orderBy: { fecha: 'desc' },
      })
    );

    return NextResponse.json({ sugerido: precio ?? null });
  } catch {
    return NextResponse.json({ sugerido: null });
  }
}
