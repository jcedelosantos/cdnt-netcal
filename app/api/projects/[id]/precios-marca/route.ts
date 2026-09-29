export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { elegirReferencia } from '@/lib/marcas';

// Propone precios para los equipos del proyecto con la marca elegida. No guarda nada:
// el cliente aplica los precios y se guardan con "Guardar precios".
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const { marca } = (await req.json().catch(() => ({}))) ?? {};
    if (!marca || typeof marca !== 'string') return NextResponse.json({ error: 'Elige una marca' }, { status: 400 });

    const project = await withRetry(() =>
      prisma.project.findFirst({ where: { id: params.id, userId }, include: { materiales: true } })
    );
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    // Precio más reciente de cada producto de la marca
    const refs = await withRetry(() =>
      prisma.precioReferencia.findMany({
        where: { userId, marca },
        distinct: ['nombre'],
        orderBy: [{ nombre: 'asc' }, { fecha: 'desc' }],
        select: { nombre: true, categoria: true, precio: true },
      })
    );

    const precios = project.materiales.flatMap((m) => {
      const ref = elegirReferencia(m.nombre, refs);
      return ref ? [{ id: m.id, precio: ref.precio, referencia: ref.nombre }] : [];
    });
    return NextResponse.json({ precios });
  } catch (error) {
    console.error('precios-marca error:', error);
    return NextResponse.json({ error: 'Error al calcular precios' }, { status: 500 });
  }
}
