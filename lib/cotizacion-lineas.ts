/**
 * Las líneas de la cotización tal como las ve el cliente, y sus totales. Es la única fuente para la
 * pantalla del proyecto, el PDF/Excel/Word de la cotización y la factura que emite INTEG (ver
 * lib/integ-facturacion.ts): la factura tiene que repetir la cotización línea por línea y dar el
 * mismo total.
 *
 * - El margen va dentro del precio de cada material (precio de venta); nunca se muestra aparte.
 * - Cada servicio va en su propia línea (Instalación = mano de obra, Configuración, Certificación,
 *   Transporte), solo si tiene monto: son cosas distintas para el cliente.
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

  const servicios: Array<[string, number | null | undefined]> = [
    ['Instalación', c.costoManoObra],
    ['Configuración', c.costoConfiguracion],
    ['Certificación', c.costoCertificacion],
    ['Transporte', c.costoTransporte],
  ];
  for (const [nombre, monto] of servicios) {
    const cents = Math.round((monto ?? 0) * 100);
    if (cents <= 0) continue;
    lineas.push({
      nombre,
      descripcion: '',
      cantidad: 1,
      unidad: 'servicio',
      precioUnitCents: cents,
      importeCents: cents,
      itbisCents: itbisDe(cents),
      esServicios: true,
    });
  }

  const subtotalCents = lineas.reduce((acc, l) => acc + l.importeCents, 0);
  const itbisCents = lineas.reduce((acc, l) => acc + l.itbisCents, 0);
  return { lineas, subtotalCents, itbisCents, totalCents: subtotalCents + itbisCents };
}
