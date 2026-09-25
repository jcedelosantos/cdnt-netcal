// Estimador público de CCTV para cedanet.net.
// Usa el motor de lib/calculations.ts y la tarifa configurada en /estimador-web.
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calcularMateriales, type ConfigProyecto, type MaterialItem } from '@/lib/calculations';

export const entradaCctvSchema = z.object({
  camaras: z.number().int().min(1).max(32),
  distancia: z.enum(['corta', 'media', 'larga']),
  instalacion: z.enum(['interior', 'exterior', 'mixta']),
});
export type EntradaCctv = z.infer<typeof entradaCctvSchema>;

const DISTANCIA_METROS: Record<EntradaCctv['distancia'], number> = { corta: 15, media: 35, larga: 60 };
const CANALIZACION: Record<EntradaCctv['instalacion'], string> = { interior: 'canaleta', exterior: 'EMT', mixta: 'EMT' };

export function configCctv(entrada: EntradaCctv): ConfigProyecto {
  const puertos = entrada.camaras <= 8 ? 8 : entrada.camaras <= 16 ? 16 : 24;
  const distancia = DISTANCIA_METROS[entrada.distancia];
  return {
    puntos: [{ tipo: 'camara_ip', cantidad: entrada.camaras, distancia }],
    categoriaCable: 'Cat6',
    tipoInstalacion: 'expuesta',
    tipoCanalizacion: CANALIZACION[entrada.instalacion],
    reservaCable: 15,
    reservaMateriales: 10,
    switchPuertos: puertos,
    switchPoE: true,
    switchPuertosPoE: puertos,
    gabineteRU: 6,
    incluyeUPS: false,
    distanciaPromedio: distancia,
    modoAvanzado: false,
  };
}

// Todos los nombres de material que puede generar el estimador de CCTV (para configurar la tarifa)
export function nombresMaterialesCctv(): string[] {
  const nombres = new Set<string>();
  for (const camaras of [1, 4, 8, 12, 16, 24, 32]) {
    for (const distancia of ['corta', 'media', 'larga'] as const) {
      for (const instalacion of ['interior', 'exterior'] as const) {
        calcularMateriales(configCctv({ camaras, distancia, instalacion })).materiales.forEach((m) => nombres.add(m.nombre));
      }
    }
  }
  return Array.from(nombres).sort((a, b) => a.localeCompare(b, 'es'));
}

export type MaterialPreciado = MaterialItem & { referencia: string | null };

export type Estimacion = {
  configId: string;
  userId: string;
  materiales: MaterialPreciado[];
  sinPrecio: string[];
  costoMateriales: number;
  margen: number;
  manoObra: number;
  costoFijo: number;
  itbis: number;
  total: number;
  minimo: number;
  maximo: number;
  moneda: 'DOP';
};

async function precioReferencia(userId: string, nombre: string): Promise<number | null> {
  const ref = await prisma.precioReferencia.findFirst({
    where: { userId, nombre: { equals: nombre, mode: 'insensitive' } },
    orderBy: { fecha: 'desc' },
    select: { precio: true },
  });
  return ref?.precio ?? null;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export async function estimarCctv(entrada: EntradaCctv, opciones: { soloActivo?: boolean } = {}): Promise<Estimacion | null> {
  const config = await prisma.estimadorConfig.findFirst({
    where: opciones.soloActivo === false ? {} : { activo: true },
    include: { materiales: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (!config) return null;

  const mapa = new Map(config.materiales.map((m) => [m.materialNombre, m]));
  const { materiales } = calcularMateriales(configCctv(entrada));

  const preciados: MaterialPreciado[] = [];
  const sinPrecio: string[] = [];
  for (const m of materiales) {
    const regla = mapa.get(m.nombre);
    if (regla && !regla.incluir) continue;
    const precio = regla?.referenciaNombre ? await precioReferencia(config.userId, regla.referenciaNombre) : null;
    if (precio == null) sinPrecio.push(m.nombre);
    const precioUnit = precio ?? 0;
    preciados.push({ ...m, precioUnit, subtotal: redondear(precioUnit * m.cantidad), referencia: regla?.referenciaNombre ?? null });
  }

  const costoMateriales = preciados.reduce((acc, m) => acc + m.subtotal, 0);
  const margen = costoMateriales * (config.margen / 100);
  const manoObra = config.manoObraPorCamara * entrada.camaras;
  const subtotal = costoMateriales + margen + manoObra + config.costoFijo;
  const itbis = subtotal * (config.itbis / 100);
  const total = subtotal + itbis;
  const r = config.rangoPct / 100;

  return {
    configId: config.id,
    userId: config.userId,
    materiales: preciados,
    sinPrecio,
    costoMateriales: redondear(costoMateriales),
    margen: redondear(margen),
    manoObra: redondear(manoObra),
    costoFijo: redondear(config.costoFijo),
    itbis: redondear(itbis),
    total: redondear(total),
    minimo: Math.floor((total * (1 - r)) / 1000) * 1000,
    maximo: Math.ceil((total * (1 + r)) / 1000) * 1000,
    moneda: 'DOP',
  };
}

// Firma HMAC de las llamadas desde el servidor de cedanet.net: hex(HMAC-SHA256(secreto, `${ts}.${cuerpo}`))
export function verificarFirma(cuerpo: string, timestamp: string | null, firma: string | null): boolean {
  const secreto = process.env.ESTIMADOR_SECRET;
  if (!secreto || !timestamp || !firma) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false;
  const esperada = crypto.createHmac('sha256', secreto).update(`${timestamp}.${cuerpo}`).digest('hex');
  const a = Buffer.from(esperada, 'hex');
  const b = Buffer.from(firma, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
