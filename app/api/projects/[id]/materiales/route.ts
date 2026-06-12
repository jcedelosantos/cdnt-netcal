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
    const id = params?.id;

    const project = await withRetry(() => prisma.project.findFirst({ where: { id, userId } }));
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const body = await req.json();
    const { materiales, cotizacion } = body ?? {};

    // Actualizar precios de materiales por id (no recrea, conserva los ids)
    if (Array.isArray(materiales)) {
      for (const m of materiales) {
        if (m?.id) {
          const existing = await prisma.projectMaterial.findUnique({ where: { id: m.id } });
          if (!existing) continue;
          const qty = m?.cantidad !== undefined ? (parseFloat(String(m.cantidad)) || 0) : existing.cantidad;
          const precio = m?.precioUnit !== undefined ? (parseFloat(String(m.precioUnit)) || 0) : existing.precioUnit;
          await prisma.projectMaterial.update({
            where: { id: m.id },
            data: { cantidad: qty, precioUnit: precio, subtotal: qty * precio },
          });
        }
      }
    }

    // Persistir parámetros de cotización en el proyecto (sin tocar materiales/puntos)
    if (cotizacion && typeof cotizacion === 'object') {
      const cotData: any = {};
      const cotFields = ['incluyeCotizacion', 'margenGanancia', 'costoManoObra',
        'costoTransporte', 'costoConfiguracion', 'costoCertificacion', 'itbis', 'moneda'];
      for (const f of cotFields) {
        if (cotizacion[f] !== undefined) cotData[f] = cotizacion[f];
      }
      if (Object.keys(cotData).length > 0) {
        await prisma.project.update({ where: { id }, data: cotData });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update materiales error:', error);
    return NextResponse.json({ error: 'Error al actualizar precios' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const project = await withRetry(() => prisma.project.findFirst({ where: { id, userId } }));
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const body = await req.json();
    const { categoria, nombre, cantidad, unidad, precioUnit } = body ?? {};

    if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

    const cant = parseFloat(cantidad) || 0;
    const precio = parseFloat(precioUnit) || 0;

    const material = await prisma.projectMaterial.create({
      data: {
        projectId: id,
        categoria: categoria?.trim() || 'Adicionales',
        nombre: nombre.trim(),
        cantidad: cant,
        unidad: unidad?.trim() || 'und',
        precioUnit: precio,
        subtotal: cant * precio,
        esPersonalizado: true,
      },
    });

    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error('Create material error:', error);
    return NextResponse.json({ error: 'Error al crear material' }, { status: 500 });
  }
}
