export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { calcularMateriales, type ConfigProyecto } from '@/lib/calculations';
import { generarNumeroFactura } from '@/lib/numeracion';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const project = await withRetry(() => prisma.project.findFirst({
      where: { id, userId },
      include: { puntos: true, materiales: true, pagos: { orderBy: { fecha: 'asc' } } },
    }));

    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    // Recalculate
    const config: ConfigProyecto = {
      puntos: (project?.puntos ?? []).map((p: any) => ({
        tipo: p?.tipo ?? 'datos',
        cantidad: p?.cantidad ?? 0,
        distancia: p?.distancia ?? 30,
      })),
      categoriaCable: project?.categoriaCable ?? 'Cat6',
      tipoInstalacion: project?.tipoInstalacion ?? 'expuesta',
      tipoCanalizacion: project?.tipoCanalización ?? 'EMT',
      reservaCable: project?.reservaCable ?? 15,
      reservaMateriales: project?.reservaMateriales ?? 10,
      switchPuertos: project?.switchPuertos ?? 24,
      switchPoE: project?.switchPoE ?? false,
      switchPuertosPoE: project?.switchPuertosPoE ?? 0,
      gabineteRU: project?.gabineteRU ?? 12,
      incluyeUPS: project?.incluyeUPS ?? false,
      distanciaPromedio: project?.distanciaPromedio ?? 30,
      modoAvanzado: project?.modoAvanzado ?? false,
    };
    const resultado = calcularMateriales(config);

    return NextResponse.json({
      project: {
        ...(project ?? {}),
        fecha: project?.fecha?.toISOString?.() ?? null,
        createdAt: project?.createdAt?.toISOString?.() ?? null,
        updatedAt: project?.updatedAt?.toISOString?.() ?? null,
        aprobadoEn: (project as any)?.aprobadoEn?.toISOString?.() ?? null,
        facturadoEn: (project as any)?.facturadoEn?.toISOString?.() ?? null,
        puntos: project?.puntos ?? [],
        materiales: project?.materiales ?? [],
        pagos: ((project as any)?.pagos ?? []).map((p: any) => ({
          ...p,
          fecha: p?.fecha?.toISOString?.() ?? null,
          createdAt: p?.createdAt?.toISOString?.() ?? null,
        })),
      },
      resultado,
    });
  } catch (error: any) {
    console.error('GET project error:', error);
    return NextResponse.json({ error: 'Error al obtener proyecto' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const existing = await withRetry(() => prisma.project.findFirst({ where: { id, userId } }));
    if (!existing) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const body = await req.json();
    const { puntos, ...projectData } = body ?? {};

    // Update project
    const updateData: any = {};
    const fields = ['nombre', 'cliente', 'ubicacion', 'modoAvanzado', 'tipoInstalacion',
      'tipoCanalizaci\u00f3n', 'categoriaCable', 'distanciaPromedio', 'reservaCable',
      'reservaMateriales', 'switchPuertos', 'switchPoE', 'switchPuertosPoE',
      'gabineteRU', 'incluyeUPS', 'incluyeCotizacion', 'margenGanancia',
      'costoManoObra', 'costoTransporte', 'costoConfiguracion', 'costoCertificacion',
      'itbis', 'notas'];

    for (const f of fields) {
      if (projectData[f] !== undefined) updateData[f] = projectData[f];
    }
    if (projectData.fecha) updateData.fecha = new Date(projectData.fecha);

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Update puntos if provided
    if (Array.isArray(puntos)) {
      await prisma.projectPoint.deleteMany({ where: { projectId: id } });
      if (puntos.length > 0) {
        await prisma.projectPoint.createMany({
          data: puntos.map((p: any) => ({
            projectId: id,
            tipo: p?.tipo ?? 'datos',
            cantidad: p?.cantidad ?? 1,
            distancia: p?.distancia ?? 30,
          })),
        });
      }
    }

    // Recalculate
    const updatedProject = await prisma.project.findFirst({
      where: { id },
      include: { puntos: true },
    });

    const config: ConfigProyecto = {
      puntos: (updatedProject?.puntos ?? []).map((p: any) => ({
        tipo: p?.tipo ?? 'datos',
        cantidad: p?.cantidad ?? 0,
        distancia: p?.distancia ?? 30,
      })),
      categoriaCable: updatedProject?.categoriaCable ?? 'Cat6',
      tipoInstalacion: updatedProject?.tipoInstalacion ?? 'expuesta',
      tipoCanalizacion: updatedProject?.tipoCanalización ?? 'EMT',
      reservaCable: updatedProject?.reservaCable ?? 15,
      reservaMateriales: updatedProject?.reservaMateriales ?? 10,
      switchPuertos: updatedProject?.switchPuertos ?? 24,
      switchPoE: updatedProject?.switchPoE ?? false,
      switchPuertosPoE: updatedProject?.switchPuertosPoE ?? 0,
      gabineteRU: updatedProject?.gabineteRU ?? 12,
      incluyeUPS: updatedProject?.incluyeUPS ?? false,
      distanciaPromedio: updatedProject?.distanciaPromedio ?? 30,
      modoAvanzado: updatedProject?.modoAvanzado ?? false,
    };
    const resultado = calcularMateriales(config);

    // Update materiales — conservar los personalizados
    await prisma.projectMaterial.deleteMany({ where: { projectId: id, esPersonalizado: false } });
    if ((resultado?.materiales?.length ?? 0) > 0) {
      await prisma.projectMaterial.createMany({
        data: (resultado?.materiales ?? []).map((m: any) => ({
          projectId: id,
          categoria: m?.categoria ?? '',
          nombre: m?.nombre ?? '',
          cantidad: m?.cantidad ?? 0,
          unidad: m?.unidad ?? 'und',
          precioUnit: m?.precioUnit ?? 0,
          subtotal: m?.subtotal ?? 0,
          esPersonalizado: false,
        })),
      });
    }

    return NextResponse.json({
      project: {
        ...(updatedProject ?? {}),
        fecha: updatedProject?.fecha?.toISOString?.() ?? null,
        createdAt: updatedProject?.createdAt?.toISOString?.() ?? null,
        updatedAt: updatedProject?.updatedAt?.toISOString?.() ?? null,
      },
      resultado,
    });
  } catch (error: any) {
    console.error('PUT project error:', error);
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
  }
}

// Actualización ligera de campos simples (ej. estado "aprobado") sin recalcular materiales
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const existing = await withRetry(() => prisma.project.findFirst({ where: { id, userId } }));
    if (!existing) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const body = await req.json();
    const data: any = {};
    if (typeof body?.aprobado === 'boolean') {
      data.aprobado = body.aprobado;
      // Registrar/limpiar la fecha de aprobación
      data.aprobadoEn = body.aprobado ? new Date() : null;
    }

    // Facturar: genera número de factura y fecha (solo una vez)
    if (body?.facturar === true) {
      if (!(existing as any).numeroFactura) {
        data.numeroFactura = await generarNumeroFactura(userId);
        data.facturadoEn = new Date();
      }
    } else if (body?.facturar === false) {
      // Revertir facturación
      data.numeroFactura = null;
      data.facturadoEn = null;
    }

    // Edición directa del número de factura (NCF)
    if (typeof body?.numeroFactura === 'string') {
      data.numeroFactura = body.numeroFactura;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    const project = await withRetry(() => prisma.project.update({ where: { id }, data }));
    return NextResponse.json({
      success: true,
      aprobado: project.aprobado,
      aprobadoEn: project.aprobadoEn?.toISOString?.() ?? null,
      numeroFactura: (project as any).numeroFactura ?? null,
      facturadoEn: (project as any).facturadoEn?.toISOString?.() ?? null,
    });
  } catch (error: any) {
    console.error('PATCH project error:', error);
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const id = params?.id;

    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE project error:', error);
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
  }
}
