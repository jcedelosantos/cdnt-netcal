// Estimador público de cedanet.net (CCTV, central telefónica, WiFi, firewall y redes).
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

// Jacks y patch cords: el doble de los equipos (un extremo en el equipo y otro en el patch panel) más 10%
const dobleMas10 = (equipos: number) => Math.ceil((equipos * 22) / 10);

// Materiales del motor de cálculo, con jacks y patch cords al doble de las cámaras más 10%
// (los proyectos internos siguen usando las cantidades de lib/calculations.ts)
export function materialesCctv(entrada: EntradaCctv): MaterialItem[] {
  const cantidad: Record<string, number> = {
    'Jack RJ45 Cat6': dobleMas10(entrada.camaras),
    'Patch Cord 0.6m (gabinete)': Math.ceil((entrada.camaras * 11) / 10),
    'Patch Cord 3m (dispositivo final)': Math.ceil((entrada.camaras * 11) / 10),
  };
  return calcularMateriales(configCctv(entrada)).materiales.map((m) =>
    m.nombre in cantidad ? { ...m, cantidad: cantidad[m.nombre] } : m
  );
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
      und('Cableado', 'Jack Cat6', dobleMas10(n)),
      und('Cableado', 'Patch cord Cat6 1 m', dobleMas10(n)),
      und('Cableado', 'Patch panel 24 puertos', Math.ceil(n / PUERTOS_SWITCH)),
    );
  }
  // Puertos para los teléfonos, la central y el enlace a la red; hasta 6 extensiones cabe en uno de 8
  if (entrada.poe === 'no') {
    materiales.push(
      n + 2 <= 8
        ? und('Redes', 'Switch PoE 8 puertos', 1)
        : und('Redes', 'Switch PoE 24 puertos', Math.ceil((n + 2) / PUERTOS_SWITCH))
    );
  }
  return materiales;
}

// Configuración del borrador que se crea en NetPlanner cuando el cliente solicita
export function configTelefonia(entrada: EntradaTelefonia): ConfigProyecto {
  const distancia = entrada.cableado === 'existente' ? 20 : METROS_POR_EXTENSION[entrada.cableado];
  const puertos = entrada.extensiones + 2 <= 8 ? 8 : PUERTOS_SWITCH * Math.ceil((entrada.extensiones + 2) / PUERTOS_SWITCH);
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

// =================== WIFI EMPRESARIAL ===================
// Access points Aruba Instant On, switch PoE y un cable por AP.

export const entradaWifiSchema = z.object({
  metros: z.number().int().min(50).max(5000), // área a cubrir en m²
  espacio: z.enum(['abierto', 'paredes', 'nave']),
  personas: z.enum(['20', '50', '100', '150']), // conectadas a la vez (150 = más de 100)
});
export type EntradaWifi = z.infer<typeof entradaWifiSchema>;

// m² que cubre un AP y metros de cable por AP según el tipo de espacio
const COBERTURA_AP: Record<EntradaWifi['espacio'], number> = { abierto: 150, paredes: 90, nave: 300 };
const CABLE_POR_AP: Record<EntradaWifi['espacio'], number> = { abierto: 25, paredes: 30, nave: 50 };
const PERSONAS_POR_AP = 25;
const APS_POR_SWITCH_8 = 6; // hasta 6 APs: switch de 8 puertos (APs, enlace y uno libre)
const APS_POR_SWITCH_195W = 12; // más APs piden el switch de 370 W

export function cantidadAps(entrada: EntradaWifi): number {
  return Math.max(Math.ceil(entrada.metros / COBERTURA_AP[entrada.espacio]), Math.ceil(Number(entrada.personas) / PERSONAS_POR_AP));
}

export function materialesWifi(entrada: EntradaWifi): MaterialItem[] {
  const aps = cantidadAps(entrada);
  const metros = aps * CABLE_POR_AP[entrada.espacio] * 1.15;
  const switches = Math.ceil((aps + 2) / PUERTOS_SWITCH);
  const switchPoe =
    aps <= APS_POR_SWITCH_8
      ? und('Redes', 'Switch PoE 8 puertos', 1)
      : und('Redes', aps > APS_POR_SWITCH_195W ? 'Switch PoE 24 puertos 370 W' : 'Switch PoE 24 puertos', switches);
  return [
    // En naves se usa el AP de mayor alcance y capacidad
    und('WiFi', entrada.espacio === 'nave' ? 'Access point alta capacidad Wi-Fi 6' : 'Access point Wi-Fi 6', aps),
    switchPoe,
    und('Cableado', 'Cable UTP Cat6 (caja 305 m)', Math.ceil(metros / 305), 'caja'),
    und('Cableado', 'Jack Cat6', dobleMas10(aps)),
    und('Cableado', 'Patch cord Cat6 1 m', dobleMas10(aps)),
    und('Cableado', 'Patch panel 24 puertos', Math.ceil(aps / PUERTOS_SWITCH)),
  ];
}

export function configWifi(entrada: EntradaWifi): ConfigProyecto {
  const aps = cantidadAps(entrada);
  const puertos = aps <= APS_POR_SWITCH_8 ? 8 : PUERTOS_SWITCH * Math.ceil((aps + 2) / PUERTOS_SWITCH);
  return {
    puntos: [{ tipo: 'access_point', cantidad: aps, distancia: CABLE_POR_AP[entrada.espacio] }],
    categoriaCable: 'Cat6',
    tipoInstalacion: 'expuesta',
    tipoCanalizacion: entrada.espacio === 'nave' ? 'EMT' : 'canaleta',
    reservaCable: 15,
    reservaMateriales: 10,
    switchPuertos: puertos,
    switchPoE: true,
    switchPuertosPoE: puertos,
    gabineteRU: 6,
    incluyeUPS: false,
    distanciaPromedio: CABLE_POR_AP[entrada.espacio],
    modoAvanzado: false,
  };
}

// =================== FIREWALL ===================
// Fortinet (con licencia de seguridad UTP de 1 año) o Aruba Instant On (gateway básico), más la configuración.

export const entradaFirewallSchema = z.object({
  marca: z.enum(['fortinet', 'aruba']),
  usuarios: z.enum(['25', '75', '150']), // hasta 25, 26 a 75, más de 75
  configuracion: z.enum(['basica', 'avanzada']),
});
export type EntradaFirewall = z.infer<typeof entradaFirewallSchema>;

export function materialesFirewall(entrada: EntradaFirewall): MaterialItem[] {
  const materiales: MaterialItem[] = [];
  if (entrada.marca === 'aruba') {
    materiales.push(und('Firewall', 'Gateway Aruba Instant On', 1));
  } else if (entrada.usuarios === '25') {
    materiales.push(und('Firewall', 'FortiGate pequeño (hasta 25 usuarios)', 1), und('Firewall', 'Licencia UTP 1 año FortiGate pequeño', 1));
  } else {
    // Incluye la licencia UTP de 12 meses
    materiales.push(und('Firewall', 'FortiGate mediano con licencia UTP 1 año', 1));
  }
  materiales.push(und('Servicios', 'Instalación de firewall', 1), und('Servicios', 'Configuración de firewall básica', 1));
  if (entrada.configuracion === 'avanzada') materiales.push(und('Servicios', 'Configuración de firewall avanzada (VPN, segmentación de red y políticas de seguridad)', 1));
  return materiales;
}

export function configFirewall(): ConfigProyecto {
  return {
    puntos: [],
    categoriaCable: 'Cat6',
    tipoInstalacion: 'expuesta',
    tipoCanalizacion: 'canaleta',
    reservaCable: 15,
    reservaMateriales: 10,
    switchPuertos: 8,
    switchPoE: false,
    switchPuertosPoE: 0,
    gabineteRU: 6,
    incluyeUPS: false,
    distanciaPromedio: 5,
    modoAvanzado: false,
  };
}

// =================== REDES (CABLEADO ESTRUCTURADO) ===================
// Basado en la cotización Nexxt de Omega Tech: cable, jacks, patch panel, patch cords y gabinete.

export const entradaRedesSchema = z.object({
  puntos: z.number().int().min(1).max(96),
  distancia: z.enum(['corta', 'media', 'larga']),
  gabinete: z.enum(['si', 'no']), // ¿ya tiene gabinete o rack?
});
export type EntradaRedes = z.infer<typeof entradaRedesSchema>;

const METROS_POR_PUNTO: Record<EntradaRedes['distancia'], number> = { corta: 15, media: 35, larga: 60 };
const PIES_ROLLO_METROS = 305; // rollo de 1000 pies
const PUNTOS_GABINETE_PEQUENO = 24; // hasta 24 puntos cabe en el de 12U
const PUERTOS_PANEL = 24;

export function materialesRedes(entrada: EntradaRedes): MaterialItem[] {
  const n = entrada.puntos;
  const paneles = Math.ceil(n / PUERTOS_PANEL);
  const masDiez = Math.ceil((n * 11) / 10);
  const metros = n * METROS_POR_PUNTO[entrada.distancia] * 1.15;
  const materiales = [
    und('Cableado', 'Rollo cable UTP Cat6 (1000 pies)', Math.ceil(metros / PIES_ROLLO_METROS), 'rollo'),
    und('Cableado', 'Jack keystone Cat6', dobleMas10(n)),
    und('Cableado', 'Patch cord Cat6 1 pie (gabinete)', masDiez),
    und('Cableado', 'Patch cord Cat6 7 pies (equipo)', masDiez),
    und('Cableado', 'Patch panel modular 24 puertos', paneles),
    und('Gabinete', 'Organizador de cables horizontal 1U', paneles),
  ];
  // Switch Aruba Instant On: puertos para los puntos y el enlace a internet (hasta 6 puntos, uno de 8)
  materiales.push(
    n + 2 <= 8
      ? und('Redes', 'Switch 8 puertos', 1)
      : und('Redes', 'Switch 24 puertos', Math.ceil((n + 2) / PUERTOS_SWITCH))
  );
  if (entrada.gabinete === 'no') {
    materiales.push(und('Gabinete', n <= PUNTOS_GABINETE_PEQUENO ? 'Gabinete de pared 12U' : 'Gabinete de pared 15U', 1));
  }
  return materiales;
}

export function configRedes(entrada: EntradaRedes): ConfigProyecto {
  return {
    puntos: [{ tipo: 'datos', cantidad: entrada.puntos, distancia: METROS_POR_PUNTO[entrada.distancia] }],
    categoriaCable: 'Cat6',
    tipoInstalacion: 'expuesta',
    tipoCanalizacion: 'canaleta',
    reservaCable: 15,
    reservaMateriales: 10,
    switchPuertos: 24,
    switchPoE: false,
    switchPuertosPoE: 0,
    gabineteRU: entrada.puntos <= PUNTOS_GABINETE_PEQUENO ? 12 : 15,
    incluyeUPS: false,
    distanciaPromedio: METROS_POR_PUNTO[entrada.distancia],
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

const ETIQUETA_WIFI = {
  espacio: { abierto: 'espacio abierto', paredes: 'oficinas con paredes', nave: 'nave o almacén' },
  personas: { '20': 'hasta 20 personas', '50': 'hasta 50 personas', '100': 'hasta 100 personas', '150': 'más de 100 personas' },
} as const;

const ETIQUETA_FIREWALL = {
  marca: { fortinet: 'Fortinet', aruba: 'Aruba Instant On' },
  usuarios: { '25': 'hasta 25 usuarios', '75': '26 a 75 usuarios', '150': 'más de 75 usuarios' },
  configuracion: { basica: 'configuración básica', avanzada: 'configuración avanzada (VPN, segmentación de red y políticas de seguridad)' },
} as const;

const ETIQUETA_REDES = {
  distancia: { corta: 'menos de 20 m', media: '20 a 50 m', larga: 'más de 50 m' },
  gabinete: { si: 'ya tiene gabinete', no: 'con gabinete nuevo' },
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
  materiales: materialesCctv,
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
  combinaciones: [
    { extensiones: 12, cableado: 'corta', poe: 'no' },
    { extensiones: 4, cableado: 'corta', poe: 'no' },
  ],
  ejemplo: { entrada: { extensiones: 10, cableado: 'corta', poe: 'no' }, texto: '10 extensiones, cableado nuevo corto, sin switch PoE' },
};

const wifi: Definicion<EntradaWifi> = {
  schema: entradaWifiSchema,
  materiales: materialesWifi,
  unidades: cantidadAps,
  config: configWifi,
  resumen: (e) => `WiFi: ${e.metros} m², ${ETIQUETA_WIFI.espacio[e.espacio]}, ${ETIQUETA_WIFI.personas[e.personas]} (${cantidadAps(e)} ${cantidadAps(e) === 1 ? 'access point' : 'access points'})`,
  nombreProyecto: (e) => `WiFi ${e.metros} m² (${cantidadAps(e)} APs)`,
  combinaciones: [
    { metros: 400, espacio: 'paredes', personas: '50' },
    { metros: 1000, espacio: 'paredes', personas: '100' },
    { metros: 5000, espacio: 'nave', personas: '150' }, // más de 12 APs: switch de 370 W
  ],
  ejemplo: { entrada: { metros: 400, espacio: 'paredes', personas: '50' }, texto: '400 m², oficinas con paredes, hasta 50 personas' },
};

const firewall: Definicion<EntradaFirewall> = {
  schema: entradaFirewallSchema,
  materiales: materialesFirewall,
  unidades: () => 1, // un equipo por proyecto
  config: configFirewall,
  resumen: (e) => `Firewall: ${ETIQUETA_FIREWALL.marca[e.marca]}, ${ETIQUETA_FIREWALL.usuarios[e.usuarios]}, ${ETIQUETA_FIREWALL.configuracion[e.configuracion]}`,
  nombreProyecto: (e) => `Firewall ${ETIQUETA_FIREWALL.marca[e.marca]}`,
  combinaciones: [
    { marca: 'fortinet', usuarios: '25', configuracion: 'avanzada' },
    { marca: 'fortinet', usuarios: '75', configuracion: 'basica' },
    { marca: 'aruba', usuarios: '25', configuracion: 'basica' },
  ],
  ejemplo: { entrada: { marca: 'fortinet', usuarios: '25', configuracion: 'basica' }, texto: 'Fortinet, hasta 25 usuarios, configuración básica' },
};

const redes: Definicion<EntradaRedes> = {
  schema: entradaRedesSchema,
  materiales: materialesRedes,
  unidades: (e) => e.puntos,
  config: configRedes,
  resumen: (e) => `Redes: ${e.puntos} puntos de red, distancia ${ETIQUETA_REDES.distancia[e.distancia]}, ${ETIQUETA_REDES.gabinete[e.gabinete]}`,
  nombreProyecto: (e) => `Cableado estructurado ${e.puntos} puntos`,
  combinaciones: [
    { puntos: 4, distancia: 'corta', gabinete: 'si' },
    { puntos: 24, distancia: 'media', gabinete: 'no' },
    { puntos: 48, distancia: 'media', gabinete: 'no' },
  ],
  ejemplo: { entrada: { puntos: 24, distancia: 'media', gabinete: 'no' }, texto: '24 puntos, distancia media, con gabinete nuevo' },
};

export const AREAS = ['cctv', 'telefonia', 'wifi', 'firewall', 'redes'] as const;
export type Area = (typeof AREAS)[number];
export const areaSchema = z.enum(AREAS);
export const DEFINICIONES: Record<Area, Definicion<any>> = { cctv, telefonia, wifi, firewall, redes };

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
