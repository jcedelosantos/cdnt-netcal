export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { FacturacionError, totalesProyecto, vistaPreviaEnInteg } from '@/lib/integ-facturacion';

// Vista previa de la factura antes de emitirla (ver vistaPreviaEnInteg). Se arma con lo GUARDADO,
// que es lo que se va a facturar: si no coincide con el total de la cotización en pantalla, no hay
// vista previa y por lo tanto no se puede confirmar.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const proyecto = await withRetry(() =>
      prisma.project.findFirst({
        where: { id: params?.id, userId },
        include: { materiales: { select: { nombre: true, descripcion: true, cantidad: true, unidad: true, precioUnit: true } }, inventoryClient: { select: { email: true, telefono: true, direccion: true } } },
      })
    );
    if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    if ((proyecto as any).numeroFactura) return NextResponse.json({ error: 'Este proyecto ya está facturado.' }, { status: 409 });

    const body = await req.json().catch(() => ({}));
    const esperado = Number(body?.totalEsperadoCents);
    if (Number.isFinite(esperado) && Math.abs(totalesProyecto(proyecto as any).totalCents - esperado) > 1) {
      return NextResponse.json({ error: 'El total de la cotización en pantalla no coincide con el guardado. Guarda los cambios del proyecto y vuelve a facturar.' }, { status: 409 });
    }

    const res = await vistaPreviaEnInteg(proyecto as any, body?.regimenEspecial === true);
    return new NextResponse(await res.arrayBuffer(), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="vista-previa.pdf"', 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    if (error instanceof FacturacionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('POST factura-preview error:', error);
    return NextResponse.json({ error: 'No se pudo armar la vista previa' }, { status: 500 });
  }
}
