/**
 * Las líneas de la cotización tal como las ve el cliente, y sus totales. Es la única fuente para la
 * pantalla del proyecto, el PDF/Excel/Word de la cotización y la factura que emite INTEG (ver
 * lib/integ-facturacion.ts): la factura tiene que repetir la cotización línea por línea y dar el
 * mismo total.
 *
 * - El margen va dentro del precio de cada material (precio de venta); nunca se muestra aparte.
 * - Mano de obra, transporte, configuración y certificación van juntos en una línea
 *   "Instalación y servicios", para no desglosar costos internos al cliente.
 * - Todo en centavos y con el ITBIS redondeado por línea, igual que INTEG (computeTotals en
 *   integ-app/api/src/lib/client-invoices.ts). Si se calcula distinto, el total de la factura no
 *   coincide con el de la cotización por algún centavo.
 */

export type MaterialCotizable = {
  nombre: string;
  descripcion?: string | null;
  cantidad: number;
  unidad?: string | null;
  precioUnit: number; // costo, sin margen
};

export type CondicionesCotizacion = {
  margenGanancia?: number | null;
  costoManoObra?: number | null;
  costoTransporte?: number | null;
  costoConfiguracion?: number | null;
  costoCertificacion?: number | null;
  itbis?: number | null;
};

export type LineaCotizacion = {
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitCents: number; // precio de venta, con margen
  importeCents: number;
  itbisCents: number;
  esServicios: boolean;
};

export const NOMBRE_LINEA_SERVICIOS = 'Instalación y servicios';

export function lineasCotizacion(materiales: MaterialCotizable[], c: CondicionesCotizacion) {
  const factor = 1 + (c.margenGanancia ?? 0) / 100;
  const itbisPct = c.itbis ?? 18;
  const itbisDe = (importeCents: number) => Math.round((importeCents * itbisPct) / 100);

  const lineas: LineaCotizacion[] = materiales.map((m) => {
    const cantidad = m.cantidad ?? 0;
    const precioUnitCents = Math.round((m.precioUnit ?? 0) * factor * 100);
    const importeCents = Math.round(cantidad * precioUnitCents);
    return {
      nombre: m.nombre ?? '',
      descripcion: m.descripcion?.trim() ?? '',
      cantidad,
      unidad: m.unidad ?? 'und',
      precioUnitCents,
      importeCents,
      itbisCents: itbisDe(importeCents),
      esServicios: false,
    };
  });

  const serviciosCents = Math.round(
    ((c.costoManoObra ?? 0) + (c.costoTransporte ?? 0) + (c.costoConfiguracion ?? 0) + (c.costoCertificacion ?? 0)) * 100
  );
  if (serviciosCents > 0) {
    lineas.push({
      nombre: NOMBRE_LINEA_SERVICIOS,
      descripcion: '',
      cantidad: 1,
      unidad: 'servicio',
      precioUnitCents: serviciosCents,
      importeCents: serviciosCents,
      itbisCents: itbisDe(serviciosCents),
      esServicios: true,
    });
  }

  const subtotalCents = lineas.reduce((acc, l) => acc + l.importeCents, 0);
  const itbisCents = lineas.reduce((acc, l) => acc + l.itbisCents, 0);
  return { lineas, subtotalCents, itbisCents, totalCents: subtotalCents + itbisCents };
}
