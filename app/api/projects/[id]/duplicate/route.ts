export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const original = await withRetry(() => prisma.project.findFirst({
      where: { id, userId },
      include: { puntos: true },
    }));

    if (!original) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...projectData } = original as any;

    const newProject = await prisma.project.create({
      data: {
        ...projectData,
        userId,
        nombre: `${original?.nombre ?? 'Proyecto'} (copia)`,
        fecha: new Date(),
        puntos: {
          create: (original?.puntos ?? []).map((p: any) => ({
            tipo: p?.tipo ?? 'datos',
            cantidad: p?.cantidad ?? 1,
            distancia: p?.distancia ?? 30,
          })),
        },
      },
    });

    return NextResponse.json({ id: newProject?.id });
  } catch (error: any) {
    console.error('Duplicate project error:', error);
    return NextResponse.json({ error: 'Error al duplicar proyecto' }, { status: 500 });
  }
}
