export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { DEFINICIONES, areaSchema, estimar, verificarFirma } from '@/lib/estimador';

// Llamado solo desde el servidor de cedanet.net, firmado con ESTIMADOR_SECRET.
// No devuelve costos ni margen: el rango y, al solicitar, las cantidades de materiales para el correo interno.

const contactoSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  empresa: z.string().trim().max(150).optional().default(''),
  telefono: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(150).optional().or(z.literal('')).default(''),
  ubicacion: z.string().trim().max(150).optional().default(''),
  mensaje: z.string().trim().max(2000).optional().default(''),
});

// Sin "area" se asume CCTV (llamadas anteriores a la central telefónica)
const base = { area: areaSchema.default('cctv'), entrada: z.unknown() };
const cuerpoSchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('estimar'), ...base }),
  z.object({ accion: z.literal('solicitar'), ...base, contacto: contactoSchema }),
]);

export async function POST(req: Request) {
  const texto = await req.text();
  if (!verificarFirma(texto, req.headers.get('x-estimador-timestamp'), req.headers.get('x-estimador-firma'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = cuerpoSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const cuerpo = parsed.data;
  const def = DEFINICIONES[cuerpo.area];
  const entrada = def.schema.safeParse(cuerpo.entrada);
  if (!entrada.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  try {
    const estimacion = await estimar(cuerpo.area, entrada.data);
    if (!estimacion) return NextResponse.json({ error: 'El estimador no está activo' }, { status: 503 });
    if (estimacion.sinPrecio.length > 0) {
      console.warn('[estimador] Materiales sin precio de referencia:', estimacion.sinPrecio.join(', '));
    }
    const rango = { minimo: estimacion.minimo, maximo: estimacion.maximo, moneda: estimacion.moneda };

    if (cuerpo.accion === 'estimar') return NextResponse.json({ rango });

    const { contacto } = cuerpo;
    const cfg = def.config(entrada.data);
    const notas = [
      'Solicitud desde el estimador de cedanet.net',
      `Contacto: ${contacto.nombre}${contacto.empresa ? ` (${contacto.empresa})` : ''}`,
      `Teléfono: ${contacto.telefono}`,
      contacto.email ? `Email: ${contacto.email}` : null,
      def.resumen(entrada.data),
      `Rango mostrado: RD$ ${rango.minimo.toLocaleString('es-DO')} – ${rango.maximo.toLocaleString('es-DO')}`,
      contacto.mensaje ? `Mensaje: ${contacto.mensaje}` : null,
      estimacion.sinPrecio.length ? `Materiales sin precio de referencia: ${estimacion.sinPrecio.join(', ')}` : null,
    ].filter(Boolean).join('\n');

    const config = await prisma.estimadorConfig.findUniqueOrThrow({ where: { id: estimacion.configId } });
    const project = await prisma.project.create({
      data: {
        userId: estimacion.userId,
        origen: 'web',
        nombre: `${def.nombreProyecto(entrada.data)} – ${contacto.empresa || contacto.nombre}`,
        cliente: contacto.empresa || contacto.nombre,
        ubicacion: contacto.ubicacion || null,
        tipoInstalacion: cfg.tipoInstalacion,
        tipoCanalización: cfg.tipoCanalizacion,
        categoriaCable: cfg.categoriaCable,
        distanciaPromedio: cfg.distanciaPromedio,
        reservaCable: cfg.reservaCable,
        reservaMateriales: cfg.reservaMateriales,
        switchPuertos: cfg.switchPuertos,
        switchPoE: cfg.switchPoE,
        switchPuertosPoE: cfg.switchPuertosPoE,
        gabineteRU: cfg.gabineteRU,
        incluyeUPS: cfg.incluyeUPS,
        margenGanancia: config.margen,
        costoManoObra: estimacion.manoObra,
        costoConfiguracion: estimacion.costoFijo,
        itbis: config.itbis,
        notas,
        puntos: { create: cfg.puntos.map((p) => ({ tipo: p.tipo, cantidad: p.cantidad, distancia: p.distancia })) },
        materiales: {
          create: estimacion.materiales.map((m) => ({
            categoria: m.categoria,
            nombre: m.nombre,
            cantidad: m.cantidad,
            unidad: m.unidad,
            precioUnit: m.precioUnit,
            subtotal: m.subtotal,
          })),
        },
      },
      select: { id: true },
    });

    // Para el correo interno de cedanet.net: resumen y cantidades, sin precios
    const materiales = estimacion.materiales.map((m) => ({ nombre: m.nombre, cantidad: m.cantidad, unidad: m.unidad }));
    return NextResponse.json({ rango, proyectoId: project.id, resumen: def.resumen(entrada.data), materiales });
  } catch (error) {
    console.error('[estimador] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
