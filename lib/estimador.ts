// Estimador público de cedanet.net (CCTV y central telefónica).
// Cada área tiene su propia tarifa en /estimador-web; los precios salen de "Precios de referencia".
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

// =================== CENTRAL TELEFÓNICA ===================
// Basado en la cotización de central IP de Reverse: central UCM, teléfonos IP, cableado y switch PoE.

export const entradaTelefoniaSchema = z.object({
  extensiones: z.number().int().min(1).max(48),
  cableado: z.enum(['existente', 'corta', 'larga']),
  poe: z.enum(['si', 'no']),
});
export type EntradaTelefonia = z.infer<typeof entradaTelefoniaSchema>;

const METROS_POR_EXTENSION: Record<Exclude<EntradaTelefonia['cableado'], 'existente'>, number> = { corta: 20, larga: 45 };
const PUERTOS_SWITCH = 24;

const und = (categoria: string, nombre: string, cantidad: number, unidad = 'und'): MaterialItem => ({
  categoria, nombre, cantidad, unidad, precioUnit: 0, subtotal: 0,
});

export function materialesTelefonia(entrada: EntradaTelefonia): MaterialItem[] {
  const n = entrada.extensiones;
  // Un teléfono con pantalla para recepción por cada 10 extensiones
  const recepcion = Math.ceil(n / 10);
  const materiales = [
    und('Telefonía', 'Central telefónica IP', 1),
    und('Telefonía', 'Teléfono IP de recepción', recepcion),
  ];
  if (n > recepcion) materiales.push(und('Telefonía', 'Teléfono IP básico', n - recepcion));
  if (entrada.cableado !== 'existente') {
    const metros = n * METROS_POR_EXTENSION[entrada.cableado] * 1.15;
    materiales.push(
      und('Cableado', 'Cable UTP Cat6 (caja 305 m)', Math.ceil(metros / 305), 'caja'),
      und('Cableado', 'Jack Cat6', n),
      und('Cableado', 'Patch cord Cat6 1 m', n * 2),
      und('Cableado', 'Patch panel 24 puertos', Math.ceil(n / PUERTOS_SWITCH)),
    );
  }
  // Puertos para los teléfonos, la central y el enlace a la red
  if (entrada.poe === 'no') materiales.push(und('Redes', 'Switch PoE 24 puertos', Math.ceil((n + 2) / PUERTOS_SWITCH)));
  return materiales;
}

// Configuración del borrador que se crea en NetPlanner cuando el cliente solicita
export function configTelefonia(entrada: EntradaTelefonia): ConfigProyecto {
  const distancia = entrada.cableado === 'existente' ? 20 : METROS_POR_EXTENSION[entrada.cableado];
  const puertos = PUERTOS_SWITCH * Math.ceil((entrada.extensiones + 2) / PUERTOS_SWITCH);
  return {
    puntos: [{ tipo: 'telefono_ip', cantidad: entrada.extensiones, distancia }],
    categoriaCable: 'Cat6',
    tipoInstalacion: 'expuesta',
    tipoCanalizacion: 'canaleta',
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

// =================== ÁREAS ===================

const ETIQUETA_CCTV = {
  distancia: { corta: 'menos de 20 m', media: '20 a 50 m', larga: 'más de 50 m' },
  instalacion: { interior: 'interior', exterior: 'exterior', mixta: 'interior y exterior' },
} as const;
const ETIQUETA_TELEFONIA = {
  cableado: { existente: 'usa la red existente', corta: 'cableado nuevo, distancias cortas', larga: 'cableado nuevo, distancias largas' },
  poe: { si: 'ya tiene switch PoE', no: 'sin switch PoE' },
} as const;

type Definicion<E> = {
  schema: z.ZodType<E>;
  materiales: (entrada: E) => MaterialItem[];
  unidades: (entrada: E) => number; // cámaras o extensiones (para la mano de obra)
  config: (entrada: E) => ConfigProyecto;
  resumen: (entrada: E) => string;
  nombreProyecto: (entrada: E) => string;
  combinaciones: E[]; // entradas de muestra para listar todos los materiales posibles
  ejemplo: { entrada: E; texto: string };
};

const cctv: Definicion<EntradaCctv> = {
  schema: entradaCctvSchema,
  materiales: (e) => calcularMateriales(configCctv(e)).materiales,
  unidades: (e) => e.camaras,
  config: configCctv,
  resumen: (e) => `CCTV: ${e.camaras} cámaras, distancia ${ETIQUETA_CCTV.distancia[e.distancia]}, instalación ${ETIQUETA_CCTV.instalacion[e.instalacion]}`,
  nombreProyecto: (e) => `CCTV ${e.camaras} cámaras`,
  combinaciones: [1, 4, 8, 12, 16, 24, 32].flatMap((camaras) =>
    (['corta', 'media', 'larga'] as const).flatMap((distancia) =>
      (['interior', 'exterior'] as const).map((instalacion) => ({ camaras, distancia, instalacion }))
    )
  ),
  ejemplo: { entrada: { camaras: 8, distancia: 'media', instalacion: 'interior' }, texto: '8 cámaras, distancia media, interior' },
};

const telefonia: Definicion<EntradaTelefonia> = {
  schema: entradaTelefoniaSchema,
  materiales: materialesTelefonia,
  unidades: (e) => e.extensiones,
  config: configTelefonia,
  resumen: (e) => `Central telefónica: ${e.extensiones} extensiones, ${ETIQUETA_TELEFONIA.cableado[e.cableado]}, ${ETIQUETA_TELEFONIA.poe[e.poe]}`,
  nombreProyecto: (e) => `Central telefónica ${e.extensiones} extensiones`,
  combinaciones: [{ extensiones: 12, cableado: 'corta', poe: 'no' }],
  ejemplo: { entrada: { extensiones: 10, cableado: 'corta', poe: 'no' }, texto: '10 extensiones, cableado nuevo corto, sin switch PoE' },
};

export const AREAS = ['cctv', 'telefonia'] as const;
export type Area = (typeof AREAS)[number];
export const areaSchema = z.enum(AREAS);
export const DEFINICIONES: Record<Area, Definicion<any>> = { cctv, telefonia };

// Todos los nombres de material que puede generar un área (para configurar la tarifa)
export function nombresMateriales(area: Area): string[] {
  const nombres = new Set<string>();
  for (const entrada of DEFINICIONES[area].combinaciones) DEFINICIONES[area].materiales(entrada).forEach((m) => nombres.add(m.nombre));
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

export async function estimar(area: Area, entrada: unknown, opciones: { soloActivo?: boolean } = {}): Promise<Estimacion | null> {
  const def = DEFINICIONES[area];
  const datos = def.schema.parse(entrada);
  const config = await prisma.estimadorConfig.findFirst({
    where: opciones.soloActivo === false ? { area } : { area, activo: true },
    include: { materiales: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (!config) return null;

  const mapa = new Map(config.materiales.map((m) => [m.materialNombre, m]));
  const materiales = def.materiales(datos);

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
  const manoObra = config.manoObraPorCamara * def.unidades(datos);
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
