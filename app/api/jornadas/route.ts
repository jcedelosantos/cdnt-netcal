export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

function calcDias(data: any): number {
  // Individual days mode: use the count from fechasIndividuales
  if (data.fechasIndividuales) {
    try {
      const arr = JSON.parse(data.fechasIndividuales);
      if (Array.isArray(arr) && arr.length > 0) return arr.length;
    } catch {}
  }
  // Range mode: calculate from date range
  if (data.fechaFin && data.fecha) {
    const d1 = new Date(data.fecha + 'T12:00:00');
    const d2 = new Date(data.fechaFin + 'T12:00:00');
    const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    return Math.max(1, diff);
  }
  return Math.max(1, parseInt(data.diasTrabajados) || 1);
}

function calcTotal(data: any) {
  const tarifa = parseFloat(data.tarifaDia) || 0;
  const dias = calcDias(data);
  const tipo = data.tipoJornada || 'completa';

  let tarifaPorDia = tarifa;
  if (tipo === 'media') tarifaPorDia = tarifa * 0.5;
  else if (tipo === 'horas') tarifaPorDia = (parseFloat(data.horasTotales) || 0) * ((parseFloat(data.tarifaHora) || 0) || tarifa / 8);
  else if (tipo === 'nocturna') tarifaPorDia = tarifa * 1.35;
  else if (tipo === 'fin_semana') tarifaPorDia = tarifa * 1.5;
  else if (tipo === 'feriado') tarifaPorDia = tarifa * 2;

  const base = tarifaPorDia * dias;
  const horasExtra = parseFloat(data.horasExtra) || 0;
  const tarifaHE = parseFloat(data.tarifaHoraExtra) || 0;
  const extras = horasExtra * tarifaHE;
  const bonificacion = parseFloat(data.bonificacion) || 0;
  const viaticos = parseFloat(data.viaticos) || 0;
  const transporte = parseFloat(data.transporte) || 0;
  const alimentacion = parseFloat(data.alimentacion) || 0;
  const descuento = parseFloat(data.descuento) || 0;

  return base + extras + bonificacion + viaticos + transporte + alimentacion - descuento;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const tecnicoId = searchParams.get('tecnicoId');
  const projectId = searchParams.get('projectId');
  const fechaInicio = searchParams.get('fechaInicio');
  const fechaFin = searchParams.get('fechaFin');
  const estado = searchParams.get('estado');
  const sinPagar = searchParams.get('sinPagar');

  const jornadas = await prisma.jornada.findMany({
    where: {
      userId,
      ...(tecnicoId ? { tecnicoId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(estado ? { estado } : {}),
      ...(sinPagar === '1' ? { periodoPagoId: null } : {}),
      ...(fechaInicio || fechaFin ? {
        fecha: {
          ...(fechaInicio ? { gte: new Date(fechaInicio) } : {}),
          ...(fechaFin ? { lte: new Date(fechaFin + 'T23:59:59') } : {}),
        },
      } : {}),
    },
    include: {
      tecnico: { select: { id: true, nombre: true, codigo: true } },
      project: { select: { id: true, nombre: true, cliente: true } },
    },
    orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(jornadas);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const data = await request.json();

    // Check overlap conflict
    const existing = await prisma.jornada.findFirst({
      where: { tecnicoId: data.tecnicoId, projectId: data.projectId, fecha: new Date(data.fecha) },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una jornada para este técnico, proyecto y fecha' }, { status: 409 });
    }

    const totalJornada = calcTotal(data);

    const diasTrabajados = calcDias(data);
    const jornada = await prisma.jornada.create({
      data: {
        userId,
        tecnicoId: data.tecnicoId,
        projectId: data.projectId,
        asignacionId: data.asignacionId || null,
        fecha: new Date(data.fecha),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        diasTrabajados,
        horaEntrada: data.horaEntrada || null,
        horaSalida: data.horaSalida || null,
        horasTotales: parseFloat(data.horasTotales) || 0,
        horasExtra: parseFloat(data.horasExtra) || 0,
        tipoJornada: data.tipoJornada || 'completa',
        tarifaDia: parseFloat(data.tarifaDia) || 0,
        tarifaHoraExtra: parseFloat(data.tarifaHoraExtra) || 0,
        bonificacion: parseFloat(data.bonificacion) || 0,
        viaticos: parseFloat(data.viaticos) || 0,
        transporte: parseFloat(data.transporte) || 0,
        alimentacion: parseFloat(data.alimentacion) || 0,
        descuento: parseFloat(data.descuento) || 0,
        totalJornada,
        actividades: data.actividades || null,
        observaciones: data.observaciones || null,
        estado: data.estado || 'presente',
        aprobadoPor: data.aprobadoPor || null,
        fechasIndividuales: data.fechasIndividuales ?? null,
      },
      include: {
        tecnico: { select: { id: true, nombre: true, codigo: true } },
        project: { select: { id: true, nombre: true, cliente: true } },
      },
    });

    return NextResponse.json(jornada);
  } catch (error: any) {
    console.error('Error creating jornada:', error);
    return NextResponse.json({ error: 'Error al registrar jornada' }, { status: 500 });
  }
}
