export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { FacturacionError, pdfDeInteg } from '@/lib/integ-facturacion';

// El PDF de la factura tal como la emitió INTEG (con NCF, firma y sello). Pasa por acá para que el
// token de INTEG nunca llegue al navegador.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    const project = await withRetry(() => prisma.project.findFirst({ where: { id: params?.id, userId } }));
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    if (!(project as any).integFacturaId) {
      return NextResponse.json({ error: 'Este proyecto no se facturó desde INTEG' }, { status: 404 });
    }

    const res = await pdfDeInteg(project.id);
    if (!res.ok) return NextResponse.json({ error: `INTEG no devolvió el PDF (error ${res.status})` }, { status: 502 });
    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${project.numeroFactura ?? 'factura'}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    if (error instanceof FacturacionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('GET factura-pdf error:', error);
    return NextResponse.json({ error: 'No se pudo obtener el PDF de la factura' }, { status: 500 });
  }
}
