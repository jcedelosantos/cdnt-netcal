/**
 * Facturar un proyecto desde INTEG.
 *
 * NetPlanner ya no numera NCF: llevaba su propio contador (contando sus facturas desde
 * B01-00000001) mientras INTEG usa la secuencia real de Cedanet, así que los dos podían repetir
 * números. Ahora "Facturar" le pide la factura a INTEG (Super Admin > Facturas recurrentes), que le
 * asigna el próximo NCF de la única secuencia, la manda al cliente y la incluye en el 607.
 *
 * Configuración (variables de Railway, las dos obligatorias):
 *   INTEG_API_URL                 p. ej. https://integ.cedanet.net
 *   NETPLANNER_FACTURACION_TOKEN  el mismo valor en NetPlanner y en INTEG
 *
 * A la factura va UNA sola línea con el subtotal de venta del proyecto (materiales + margen +
 * costos), igual que el subtotal consolidado de la cotización: nunca los costos de suplidor.
 */

export type ProyectoAFacturar = {
  id: string;
  nombre: string;
  cliente: string | null;
  clienteRNC: string | null;
  ubicacion: string | null;
  numeroCotizacion: string | null;
  itbis: number;
  margenGanancia: number;
  costoManoObra: number;
  costoTransporte: number;
  costoConfiguracion: number;
  costoCertificacion: number;
  materiales: Array<{ subtotal: number }>;
  inventoryClient?: { email: string | null; telefono: string | null; direccion: string | null } | null;
};

export type FacturaInteg = {
  id: number;
  created: boolean;
  ncf: string;
  issuedAt: string;
  subtotalCents: number;
  itbisCents: number;
  totalCents: number;
  sentAt: string | null;
  sendError: string | null;
};

export class FacturacionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function integConfigurado(): boolean {
  return !!process.env.INTEG_API_URL?.trim() && !!process.env.NETPLANNER_FACTURACION_TOKEN?.trim();
}

// Mismo cálculo que la cotización (calcularTotalesCotizacion en la pantalla del proyecto y el
// reporte 607), sobre lo que está GUARDADO en la base.
export function totalesProyecto(p: ProyectoAFacturar) {
  const subtotalMateriales = p.materiales.reduce((acc, m) => acc + (m.subtotal ?? 0), 0);
  const margen = subtotalMateriales * ((p.margenGanancia ?? 0) / 100);
  const subtotalGeneral =
    subtotalMateriales + margen + (p.costoManoObra ?? 0) + (p.costoTransporte ?? 0) + (p.costoConfiguracion ?? 0) + (p.costoCertificacion ?? 0);
  const subtotalCents = Math.round(subtotalGeneral * 100);
  const itbisCents = Math.round(subtotalCents * ((p.itbis ?? 18) / 100));
  return { subtotalCents, itbisCents, totalCents: subtotalCents + itbisCents };
}

export function armarPedido(p: ProyectoAFacturar, enviar: boolean) {
  if (!p.cliente?.trim()) throw new FacturacionError('El proyecto no tiene cliente: agrégalo antes de facturar.', 400);
  // INTEG factura con ITBIS de 18% o exento; otra tasa no tendría cómo salir bien en la factura.
  if (p.itbis !== 18 && p.itbis !== 0) {
    throw new FacturacionError(`El proyecto tiene ITBIS de ${p.itbis}%. Solo se puede facturar con 18% o exento (0%).`, 400);
  }
  const { subtotalCents } = totalesProyecto(p);
  if (subtotalCents <= 0) throw new FacturacionError('El proyecto da cero: no hay nada que facturar.', 400);

  return {
    externalRef: p.id,
    concept: p.nombre,
    client: {
      name: p.cliente.trim(),
      rnc: p.clienteRNC?.trim() ?? '',
      address: p.inventoryClient?.direccion?.trim() || p.ubicacion?.trim() || '',
      phone: p.inventoryClient?.telefono?.trim() ?? '',
      email: p.inventoryClient?.email?.trim() ?? '',
    },
    lines: [
      {
        description: p.nombre.slice(0, 200),
        note: p.numeroCotizacion ? `Según cotización ${p.numeroCotizacion}` : '',
        quantity: 1,
        unitPriceCents: subtotalCents,
        taxable: p.itbis === 18,
      },
    ],
    send: enviar,
  };
}

export async function facturarEnInteg(p: ProyectoAFacturar, enviar: boolean): Promise<FacturaInteg> {
  const baseUrl = process.env.INTEG_API_URL?.trim().replace(/\/+$/, '');
  const token = process.env.NETPLANNER_FACTURACION_TOKEN?.trim();
  if (!baseUrl || !token) {
    throw new FacturacionError('Falta conectar NetPlanner con INTEG (variables INTEG_API_URL y NETPLANNER_FACTURACION_TOKEN en Railway).', 503);
  }
  const pedido = armarPedido(p, enviar);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/external/netplanner/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(pedido),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    // Puede que INTEG sí la haya emitido y la respuesta se perdió: volver a darle a Facturar es
    // seguro, INTEG devuelve la misma factura (mismo proyecto) sin gastar otro NCF.
    throw new FacturacionError('No se pudo conectar con INTEG. Intenta de nuevo: no se duplica la factura.', 502);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalle = typeof body?.error === 'string' ? body.error : `error ${res.status}`;
    throw new FacturacionError(`INTEG no emitió la factura: ${detalle}`, res.status >= 500 ? 502 : 400);
  }
  if (!body?.ncf) throw new FacturacionError('INTEG respondió sin NCF.', 502);
  return body as FacturaInteg;
}

// El PDF de la factura, tal como lo emitió INTEG.
export async function pdfDeInteg(projectId: string): Promise<Response> {
  const baseUrl = process.env.INTEG_API_URL?.trim().replace(/\/+$/, '');
  const token = process.env.NETPLANNER_FACTURACION_TOKEN?.trim();
  if (!baseUrl || !token) throw new FacturacionError('Falta conectar NetPlanner con INTEG.', 503);
  return fetch(`${baseUrl}/external/netplanner/invoices/${encodeURIComponent(projectId)}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
}
