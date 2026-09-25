export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { configCctv, entradaCctvSchema, estimarCctv, verificarFirma } from '@/lib/estimador';

// Llamado solo desde el servidor de cedanet.net, firmado con ESTIMADOR_SECRET.
// No devuelve costos, margen ni desglose: solo el rango de precio.

const contactoSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  empresa: z.string().trim().max(150).optional().default(''),
  telefono: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(150).optional().or(z.literal('')).default(''),
  ubicacion: z.string().trim().max(150).optional().default(''),
  mensaje: z.string().trim().max(2000).optional().default(''),
});

const cuerpoSchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('estimar'), entrada: entradaCctvSchema }),
  z.object({ accion: z.literal('solicitar'), entrada: entradaCctvSchema, contacto: contactoSchema }),
]);

const ETIQUETA = {
  distancia: { corta: 'menos de 20 m', media: '20 a 50 m', larga: 'más de 50 m' },
  instalacion: { interior: 'interior', exterior: 'exterior', mixta: 'interior y exterior' },
} as const;

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

  try {
    const estimacion = await estimarCctv(cuerpo.entrada);
    if (!estimacion) return NextResponse.json({ error: 'El estimador no está activo' }, { status: 503 });
    if (estimacion.sinPrecio.length > 0) {
      console.warn('[estimador] Materiales sin precio de referencia:', estimacion.sinPrecio.join(', '));
    }
    const rango = { minimo: estimacion.minimo, maximo: estimacion.maximo, moneda: estimacion.moneda };

    if (cuerpo.accion === 'estimar') return NextResponse.json({ rango });

    const { entrada, contacto } = cuerpo;
    const cfg = configCctv(entrada);
    const notas = [
      'Solicitud desde el estimador de cedanet.net',
      `Contacto: ${contacto.nombre}${contacto.empresa ? ` (${contacto.empresa})` : ''}`,
      `Teléfono: ${contacto.telefono}`,
      contacto.email ? `Email: ${contacto.email}` : null,
      `CCTV: ${entrada.camaras} cámaras, distancia ${ETIQUETA.distancia[entrada.distancia]}, instalación ${ETIQUETA.instalacion[entrada.instalacion]}`,
      `Rango mostrado: RD$ ${rango.minimo.toLocaleString('es-DO')} – ${rango.maximo.toLocaleString('es-DO')}`,
      contacto.mensaje ? `Mensaje: ${contacto.mensaje}` : null,
      estimacion.sinPrecio.length ? `Materiales sin precio de referencia: ${estimacion.sinPrecio.join(', ')}` : null,
    ].filter(Boolean).join('\n');

    const config = await prisma.estimadorConfig.findUniqueOrThrow({ where: { id: estimacion.configId } });
    const project = await prisma.project.create({
      data: {
        userId: estimacion.userId,
        origen: 'web',
        nombre: `CCTV ${entrada.camaras} cámaras – ${contacto.empresa || contacto.nombre}`,
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

    return NextResponse.json({ rango, proyectoId: project.id });
  } catch (error) {
    console.error('[estimador] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
