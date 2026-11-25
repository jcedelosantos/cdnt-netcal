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
 * La factura lleva las MISMAS líneas de la cotización (lib/cotizacion-lineas.ts): cada material con
 * su precio de venta y descripción, y cada servicio (instalación, configuración, etc.) en su línea. Nunca los costos de
 * suplidor ni una línea consolidada.
 */

import { lineasCotizacion } from './cotizacion-lineas';

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
  materiales: Array<{ nombre: string; descripcion?: string | null; cantidad: number; unidad?: string | null; precioUnit: number }>;
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

// Mismo cálculo que la cotización (pantalla del proyecto y PDF), sobre lo que está GUARDADO en la base.
export function totalesProyecto(p: ProyectoAFacturar) {
  const { subtotalCents, itbisCents, totalCents } = lineasCotizacion(p.materiales, p);
  return { subtotalCents, itbisCents, totalCents };
}

// INTEG acepta hasta 100 líneas por factura (projectInvoiceRequestSchema en integ-app).
const MAX_LINEAS = 100;

// regimenEspecial: cliente exonerado de ITBIS en este proyecto (ej. algunos de Club Naco). INTEG lo
// emite como E44 (régimen especial) en vez de E31; el proyecto tiene que estar con ITBIS 0%.
export function armarPedido(p: ProyectoAFacturar, enviar: boolean, regimenEspecial = false) {
  if (!p.cliente?.trim()) throw new FacturacionError('El proyecto no tiene cliente: agrégalo antes de facturar.', 400);
  // INTEG factura con ITBIS de 18% o exento; otra tasa no tendría cómo salir bien en la factura.
  if (p.itbis !== 18 && p.itbis !== 0) {
    throw new FacturacionError(`El proyecto tiene ITBIS de ${p.itbis}%. Solo se puede facturar con 18% o exento (0%).`, 400);
  }
  if (regimenEspecial && p.itbis !== 0) {
    throw new FacturacionError('Un proyecto exonerado (E44) va sin ITBIS: pon el ITBIS del proyecto en 0% y guarda antes de facturar.', 400);
  }
  const { lineas, subtotalCents } = lineasCotizacion(p.materiales, p);
  if (subtotalCents <= 0) throw new FacturacionError('El proyecto da cero: no hay nada que facturar.', 400);
  // Una línea en cero no va en la factura (no suma nada y confunde al cliente).
  const aFacturar = lineas.filter((l) => l.importeCents > 0);
  if (aFacturar.length > MAX_LINEAS) {
    throw new FacturacionError(`La cotización tiene ${aFacturar.length} líneas con monto; la factura admite hasta ${MAX_LINEAS}. Agrupa materiales antes de facturar.`, 400);
  }

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
    lines: aFacturar.map((l) => {
      // INTEG cobra cantidades enteras. Con una fracción (ej. 30.5 m de cable) la línea va como 1 por
      // el importe, con la cantidad real en la descripción: el importe y el ITBIS quedan iguales.
      const entera = Number.isInteger(l.cantidad) && l.cantidad >= 1;
      const detalle = entera ? '' : `${l.cantidad} ${l.unidad} a RD$${(l.precioUnitCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      return {
        description: l.nombre.slice(0, 200),
        note: [detalle, l.descripcion].filter(Boolean).join('\n').slice(0, 300),
        quantity: entera ? l.cantidad : 1,
        unitPriceCents: entera ? l.precioUnitCents : l.importeCents,
        taxable: p.itbis === 18,
      };
    }),
    note: p.numeroCotizacion ? `Según cotización ${p.numeroCotizacion}` : '',
    send: enviar,
    ...(regimenEspecial ? { specialRegime: true } : {}),
  };
}

export async function facturarEnInteg(p: ProyectoAFacturar, enviar: boolean, regimenEspecial = false): Promise<FacturaInteg> {
  const baseUrl = process.env.INTEG_API_URL?.trim().replace(/\/+$/, '');
  const token = process.env.NETPLANNER_FACTURACION_TOKEN?.trim();
  if (!baseUrl || !token) {
    throw new FacturacionError('Falta conectar NetPlanner con INTEG (variables INTEG_API_URL y NETPLANNER_FACTURACION_TOKEN en Railway).', 503);
  }
  const pedido = armarPedido(p, enviar, regimenEspecial);

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
