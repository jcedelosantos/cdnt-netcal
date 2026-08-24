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

    // Incluir TODOS los materiales (con sus precios guardados)
    const original = await withRetry(() => prisma.project.findFirst({
      where: { id, userId },
      include: {
        puntos: true,
        materiales: true,
      },
    }));

    if (!original) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    // Extraer solo campos escalares (excluir relaciones y metadatos del original)
    const {
      id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua,
      puntos: _puntos, materiales: _materiales,
      aprobado: _ap, aprobadoEn: _apEn,
      numeroCotizacion: _nc, numeroFactura: _nf, facturadoEn: _fEn,
      ...scalarData
    } = original as any;

    const newProject = await prisma.project.create({
      data: {
        ...scalarData,
        userId,
        nombre: `${original?.nombre ?? 'Proyecto'} (copia)`,
        fecha: new Date(),
        estadoPago: 'pendiente',
        aprobado: false,
        puntos: {
          create: (original?.puntos ?? []).map((p: any) => ({
            tipo: p?.tipo ?? 'datos',
            cantidad: p?.cantidad ?? 1,
            distancia: p?.distancia ?? 30,
          })),
        },
      },
    });

    // Copiar TODOS los materiales con sus precios exactos del original
    if ((original?.materiales ?? []).length > 0) {
      await prisma.projectMaterial.createMany({
        data: (original.materiales ?? []).map((m: any) => ({
          projectId: newProject.id,
          categoria: m?.categoria ?? '',
          nombre: m?.nombre ?? '',
          cantidad: m?.cantidad ?? 0,
          unidad: m?.unidad ?? 'und',
          precioUnit: m?.precioUnit ?? 0,
          subtotal: m?.subtotal ?? 0,
          esPersonalizado: m?.esPersonalizado ?? false,
        })),
      });
    }

    return NextResponse.json({ id: newProject?.id });
  } catch (error: any) {
    console.error('Duplicate project error:', error);
    return NextResponse.json({ error: 'Error al duplicar proyecto' }, { status: 500 });
  }
}
