export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST /api/periodos-pago/[id]/cierre
// Cierre semanal: agrupa jornadas aprobadas del rango, aplica anticipos pendientes, genera detalles de pago
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const periodo = await prisma.periodoPago.findFirst({ where: { id: params.id, userId } });
  if (!periodo) return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 });
  if (periodo.estado !== 'borrador') {
    return NextResponse.json({ error: 'Solo se puede procesar un periodo en borrador' }, { status: 400 });
  }

  try {
    // Fetch approved jornadas in range not yet paid
    const jornadas = await prisma.jornada.findMany({
      where: {
        userId,
        estado: 'aprobado',
        periodoPagoId: null,
        fecha: { gte: periodo.fechaInicio, lte: periodo.fechaFin },
      },
      include: { tecnico: true },
    });

    if (jornadas.length === 0) {
      return NextResponse.json({ error: 'No hay jornadas aprobadas sin pagar en este periodo' }, { status: 400 });
    }

    // Group by tecnico
    const byTecnico: Record<string, typeof jornadas> = {};
    for (const j of jornadas) {
      if (!byTecnico[j.tecnicoId]) byTecnico[j.tecnicoId] = [];
      byTecnico[j.tecnicoId].push(j);
    }

    let totalBruto = 0;
    let totalAnticipos = 0;
    let totalDescuentos = 0;

    // Get pending anticipos for all technicians
    const tecnicoIds = Object.keys(byTecnico);
    const anticiposPendientes = await prisma.anticipo.findMany({
      where: { userId, tecnicoId: { in: tecnicoIds }, estado: 'pendiente' },
    });

    const detalles: any[] = [];

    for (const [tecnicoId, jorns] of Object.entries(byTecnico)) {
      const tecnico = jorns[0].tecnico;
      const diasTrabajados = jorns.length;
      const horasNormales = jorns.reduce((s, j) => s + j.horasTotales, 0);
      const horasExtra = jorns.reduce((s, j) => s + j.horasExtra, 0);
      const salarioBase = jorns.reduce((s, j) => s + j.tarifaDia, 0);
      const bonificaciones = jorns.reduce((s, j) => s + j.bonificacion, 0);
      const viaticos = jorns.reduce((s, j) => s + j.viaticos, 0);
      const transporte = jorns.reduce((s, j) => s + j.transporte, 0);
      const alimentacion = jorns.reduce((s, j) => s + j.alimentacion, 0);
      const descuentos = jorns.reduce((s, j) => s + j.descuento, 0);
      const pagoBruto = jorns.reduce((s, j) => s + j.totalJornada, 0);

      // Apply pending anticipos
      const misAnticipos = anticiposPendientes.filter(a => a.tecnicoId === tecnicoId);
      const montoAnticipos = misAnticipos.reduce((s, a) => s + a.monto, 0);
      const pagoNeto = Math.max(0, pagoBruto - montoAnticipos - descuentos);

      totalBruto += pagoBruto;
      totalAnticipos += montoAnticipos;
      totalDescuentos += descuentos;

      detalles.push({
        periodoPagoId: periodo.id,
        tecnicoId,
        userId,
        diasTrabajados,
        horasNormales,
        horasExtra,
        salarioBase,
        bonificaciones,
        viaticos,
        transporte,
        alimentacion,
        descuentos,
        anticipos: montoAnticipos,
        pagoBruto,
        pagoNeto,
        estado: 'pendiente',
      });

      // Mark anticipos as applied
      for (const ant of misAnticipos) {
        await prisma.anticipo.update({
          where: { id: ant.id },
          data: { estado: 'aplicado', periodoPagoId: periodo.id },
        });
      }
    }

    // Create detalles
    await prisma.detallePago.createMany({ data: detalles });

    // Link jornadas to periodo
    await prisma.jornada.updateMany({
      where: { id: { in: jornadas.map(j => j.id) } },
      data: { periodoPagoId: periodo.id },
    });

    // Update periodo totals and state
    const totalNeto = totalBruto - totalAnticipos - totalDescuentos;
    await prisma.periodoPago.update({
      where: { id: periodo.id },
      data: {
        totalBruto,
        totalAnticipos,
        totalDescuentos,
        totalNeto: Math.max(0, totalNeto),
        estado: 'revision',
      },
    });

    // Generate recibos
    const periodoActualizado = await prisma.periodoPago.findUnique({
      where: { id: periodo.id },
      include: { detalles: true },
    });

    for (const detalle of periodoActualizado!.detalles) {
      const count = await prisma.recibo.count({ where: { userId } });
      const numero = `REC-${String(count + 1).padStart(5, '0')}`;
      await prisma.recibo.create({
        data: {
          numero,
          periodoPagoId: periodo.id,
          detallePagoId: detalle.id,
          tecnicoId: detalle.tecnicoId,
          userId,
          estado: 'pendiente',
        },
      });
    }

    return NextResponse.json({
      success: true,
      jornadasProcesadas: jornadas.length,
      tecnicosIncluidos: Object.keys(byTecnico).length,
      totalBruto,
      totalNeto: Math.max(0, totalBruto - totalAnticipos - totalDescuentos),
    });
  } catch (error: any) {
    console.error('Error en cierre semanal:', error);
    return NextResponse.json({ error: 'Error al procesar cierre' }, { status: 500 });
  }
}
