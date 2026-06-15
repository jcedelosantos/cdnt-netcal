export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const mes = parseInt(searchParams.get('mes') ?? '0');
    const año = parseInt(searchParams.get('año') ?? '0');

    if (!mes || !año) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });

    const desde = new Date(año, mes - 1, 1);
    const hasta = new Date(año, mes, 1);

    const projects = await withRetry(() =>
      prisma.project.findMany({
        where: {
          userId,
          numeroFactura: { not: null },
          facturadoEn: { gte: desde, lt: hasta },
        },
        orderBy: { facturadoEn: 'asc' },
        include: { materiales: true },
      })
    );

    const filas = projects.map((p: any) => {
      const subtotalMateriales = (p.materiales ?? []).reduce((acc: number, m: any) => acc + (m.subtotal ?? 0), 0);
      const margen = subtotalMateriales * ((p.margenGanancia ?? 0) / 100);
      const subtotalGeneral =
        subtotalMateriales +
        margen +
        (p.costoManoObra ?? 0) +
        (p.costoTransporte ?? 0) +
        (p.costoConfiguracion ?? 0) +
        (p.costoCertificacion ?? 0);
      const itbisValor = subtotalGeneral * ((p.itbis ?? 18) / 100);
      const total = subtotalGeneral + itbisValor;

      // NCF sin guion: B01-00000001 → B0100000001
      const ncf = (p.numeroFactura ?? '').replace('-', '');

      // Fecha como YYYYMMDD entero
      const d = p.facturadoEn ? new Date(p.facturadoEn) : new Date();
      const fechaInt =
        d.getFullYear() * 10000 +
        (d.getMonth() + 1) * 100 +
        d.getDate();

      return {
        estadoPago: p.estadoPago ?? 'pendiente',
        enviado: null,
        nombreCliente: p.cliente ?? '',
        rncCedula: p.clienteRNC ? p.clienteRNC.replace(/\D/g, '') : null,
        tipoIdentificacion: 'SERVICIO',
        ncf,
        ncfModificado: null,
        tipoIngreso: 1,
        fechaComprobante: fechaInt,
        fechaRetencion: null,
        montoFacturado: Math.round(subtotalGeneral * 100) / 100,
        itbisFacturado: Math.round(itbisValor * 100) / 100,
        itbisRetenido: null,
        itbisPercibido: null,
        retencionRenta: null,
        isrPercibido: null,
        impuestoSelectivo: null,
        otrosImpuestos: null,
        montoPropina: null,
        efectivo: null,
        chequeTransferencia: Math.round(total * 100) / 100,
        tarjetaDebito: null,
        ventaCredito: null,
        bonos: null,
        permuta: null,
        otrasFormas: null,
        totalFactura: Math.round(total * 100) / 100,
        formaPago: 'TRANSFERENCIA',
      };
    });

    return NextResponse.json({ filas, total: filas.length, mes, año });
  } catch (error: any) {
    console.error('GET reporte 607 error:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
