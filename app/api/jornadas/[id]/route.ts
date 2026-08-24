export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const data = await request.json();
    const existing = await prisma.jornada.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const fechaFin = data.fechaFin !== undefined ? (data.fechaFin ? new Date(data.fechaFin) : null) : existing.fechaFin;
    const fecha = data.fecha ? new Date(data.fecha) : existing.fecha;
    let diasTrabajados = existing.diasTrabajados;
    // Individual days mode takes priority
    const fechasIndividualesRaw = data.fechasIndividuales !== undefined ? data.fechasIndividuales : existing.fechasIndividuales;
    if (fechasIndividualesRaw) {
      try {
        const arr = JSON.parse(fechasIndividualesRaw);
        if (Array.isArray(arr) && arr.length > 0) diasTrabajados = arr.length;
      } catch {}
    } else if (data.fechaFin !== undefined || data.fecha !== undefined) {
      const fin = fechaFin ?? fecha;
      diasTrabajados = Math.max(1, Math.round((fin.getTime() - fecha.getTime()) / 86400000) + 1);
    } else if (data.diasTrabajados !== undefined) {
      diasTrabajados = Math.max(1, parseInt(data.diasTrabajados));
    }

    const updated = await prisma.jornada.update({
      where: { id: params.id },
      data: {
        fechaFin,
        diasTrabajados,
        horaEntrada: data.horaEntrada !== undefined ? data.horaEntrada : existing.horaEntrada,
        horaSalida: data.horaSalida !== undefined ? data.horaSalida : existing.horaSalida,
        horasTotales: data.horasTotales !== undefined ? parseFloat(data.horasTotales) : existing.horasTotales,
        horasExtra: data.horasExtra !== undefined ? parseFloat(data.horasExtra) : existing.horasExtra,
        tipoJornada: data.tipoJornada ?? existing.tipoJornada,
        tarifaDia: data.tarifaDia !== undefined ? parseFloat(data.tarifaDia) : existing.tarifaDia,
        tarifaHoraExtra: data.tarifaHoraExtra !== undefined ? parseFloat(data.tarifaHoraExtra) : existing.tarifaHoraExtra,
        bonificacion: data.bonificacion !== undefined ? parseFloat(data.bonificacion) : existing.bonificacion,
        viaticos: data.viaticos !== undefined ? parseFloat(data.viaticos) : existing.viaticos,
        transporte: data.transporte !== undefined ? parseFloat(data.transporte) : existing.transporte,
        alimentacion: data.alimentacion !== undefined ? parseFloat(data.alimentacion) : existing.alimentacion,
        descuento: data.descuento !== undefined ? parseFloat(data.descuento) : existing.descuento,
        totalJornada: data.totalJornada !== undefined ? parseFloat(data.totalJornada) : existing.totalJornada,
        actividades: data.actividades !== undefined ? data.actividades : existing.actividades,
        observaciones: data.observaciones !== undefined ? data.observaciones : existing.observaciones,
        estado: data.estado ?? existing.estado,
        aprobadoPor: data.aprobadoPor !== undefined ? data.aprobadoPor : existing.aprobadoPor,
        fechasIndividuales: data.fechasIndividuales !== undefined ? data.fechasIndividuales : existing.fechasIndividuales,
      },
      include: {
        tecnico: { select: { id: true, nombre: true, codigo: true } },
        project: { select: { id: true, nombre: true, cliente: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar jornada' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const existing = await prisma.jornada.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  await prisma.jornada.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
