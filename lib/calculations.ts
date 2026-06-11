// Motor de cálculo de materiales para redes

export interface PuntoRed {
  tipo: string;
  cantidad: number;
  distancia: number;
}

export interface ConfigProyecto {
  puntos: PuntoRed[];
  categoriaCable: string;
  tipoInstalacion: string;
  tipoCanalizacion: string;
  reservaCable: number;
  reservaMateriales: number;
  switchPuertos: number;
  switchPoE: boolean;
  switchPuertosPoE: number;
  gabineteRU: number;
  incluyeUPS: boolean;
  distanciaPromedio: number;
  modoAvanzado: boolean;
}

export interface MaterialItem {
  categoria: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnit: number;
  subtotal: number;
}

export interface Alerta {
  tipo: 'warning' | 'error' | 'info' | 'success';
  mensaje: string;
}

export interface ResultadoCalculo {
  materiales: MaterialItem[];
  alertas: Alerta[];
  resumen: {
    totalPuntos: number;
    totalCableMetros: number;
    totalCajas: number;
    puntosPoE: number;
    ruEspacioNecesario: number;
  };
}

const CAJA_CABLE_METROS = 305;
const LONGITUD_TUBO = 3;
const ABRAZADERA_CADA = 1.5;
const REGISTRO_CADA_MIN = 15;
const ETIQUETAS_POR_PUNTO = 3;
const CRECIMIENTO_SWITCH = 0.20;

function esPuntoPoE(tipo: string): boolean {
  return ['camara_ip', 'access_point', 'telefono_ip'].includes(tipo);
}

function getNombreTipo(tipo: string): string {
  const nombres: Record<string, string> = {
    datos: 'Datos',
    voz: 'Voz',
    datos_voz: 'Datos + Voz',
    camara_ip: 'Cámara IP',
    access_point: 'Access Point',
    telefono_ip: 'Teléfono IP',
  };
  return nombres[tipo] ?? tipo;
}

export function calcularMateriales(config: ConfigProyecto): ResultadoCalculo {
  const materiales: MaterialItem[] = [];
  const alertas: Alerta[] = [];

  const puntos = config?.puntos ?? [];
  const reservaCable = (config?.reservaCable ?? 15) / 100;
  const reservaMat = (config?.reservaMateriales ?? 10) / 100;

  // Contar puntos totales y por tipo
  let totalPuntos = 0;
  let puntosPoE = 0;
  let totalCableMetros = 0;
  let maxDistancia = 0;

  const puntosPorTipo: Record<string, number> = {};

  for (const p of puntos) {
    const cant = p?.cantidad ?? 0;
    const dist = config?.modoAvanzado ? (p?.distancia ?? 30) : (config?.distanciaPromedio ?? 30);
    const tipo = p?.tipo ?? 'datos';

    // Para datos+voz, cada punto necesita 2 cables
    const cablesPorPunto = tipo === 'datos_voz' ? 2 : 1;
    const puntosReales = cant * cablesPorPunto;

    totalPuntos += puntosReales;
    puntosPorTipo[tipo] = (puntosPorTipo[tipo] ?? 0) + cant;

    if (esPuntoPoE(tipo)) puntosPoE += cant;

    // Cable: distancia + 3m holgura gabinete + 3m holgura punto + reserva
    const cableBase = (dist + 6) * puntosReales;
    const cableConReserva = cableBase * (1 + reservaCable);
    totalCableMetros += cableConReserva;

    if (dist > maxDistancia) maxDistancia = dist;
    if (dist > 90) {
      alertas.push({ tipo: 'error', mensaje: `Punto tipo "${getNombreTipo(tipo)}" excede 90m (${dist}m). Según norma TIA/EIA-568 el máximo es 90m de cable horizontal.` });
    }
  }

  const totalCajas = Math.ceil(totalCableMetros / CAJA_CABLE_METROS);

  // =================== CABLEADO ESTRUCTURADO ===================
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: `Cable UTP ${config?.categoriaCable ?? 'Cat6'} (caja 305m)`,
    cantidad: totalCajas,
    unidad: 'caja',
    precioUnit: 0,
    subtotal: 0,
  });

  // Patch panels (24 puertos)
  const patchPanels = Math.ceil(totalPuntos / 24);
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: `Patch Panel 24 puertos ${config?.categoriaCable ?? 'Cat6'}`,
    cantidad: patchPanels,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // Switches
  const puertosNecesarios = Math.ceil(totalPuntos * (1 + CRECIMIENTO_SWITCH));
  const switchesNecesarios = Math.ceil(puertosNecesarios / (config?.switchPuertos ?? 24));
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: `Switch ${config?.switchPuertos ?? 24} puertos${config?.switchPoE ? ' PoE' : ''}`,
    cantidad: switchesNecesarios,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // Jacks RJ45
  const jacksTotal = Math.ceil(totalPuntos * (1 + reservaMat));
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: `Jack RJ45 ${config?.categoriaCable ?? 'Cat6'}`,
    cantidad: jacksTotal,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // Faceplates
  let totalFaceplates = 0;
  for (const p of puntos) {
    const tipo = p?.tipo ?? 'datos';
    totalFaceplates += p?.cantidad ?? 0;
  }
  // datos+voz usa faceplate doble
  const faceplatesSimples = totalFaceplates - (puntosPorTipo['datos_voz'] ?? 0);
  const faceplatesDobles = puntosPorTipo['datos_voz'] ?? 0;

  if (faceplatesSimples > 0) {
    materiales.push({
      categoria: 'Cableado Estructurado',
      nombre: 'Faceplate 1 puerto',
      cantidad: Math.ceil(faceplatesSimples * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
  }
  if (faceplatesDobles > 0) {
    materiales.push({
      categoria: 'Cableado Estructurado',
      nombre: 'Faceplate 2 puertos',
      cantidad: Math.ceil(faceplatesDobles * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
  }

  // Terminales RJ45 (para pruebas y rehacer)
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: 'Conector RJ45 macho',
    cantidad: Math.ceil(totalPuntos * 2 * (1 + reservaMat)),
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // Patch cords cortos (gabinete) - 0.6m
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: 'Patch Cord 0.6m (gabinete)',
    cantidad: totalPuntos,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // Patch cords largos (dispositivos) - 3m
  materiales.push({
    categoria: 'Cableado Estructurado',
    nombre: 'Patch Cord 3m (dispositivo final)',
    cantidad: totalPuntos,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // =================== GABINETE/RACK ===================
  // Calcular RU necesarias
  const ruPatchPanels = patchPanels; // 1 RU cada uno
  const ruSwitches = switchesNecesarios; // 1 RU cada uno
  const ruOrganizadores = patchPanels; // 1 por cada patch panel
  const ruUPS = config?.incluyeUPS ? 2 : 0;
  const ruBandeja = 1;
  const ruVentilacion = 1;
  const ruTotal = ruPatchPanels + ruSwitches + ruOrganizadores + ruUPS + ruBandeja + ruVentilacion + 2; // +2 reserva

  materiales.push({
    categoria: 'Gabinete/Rack',
    nombre: `Gabinete/Rack ${config?.gabineteRU ?? 12}RU`,
    cantidad: 1,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  materiales.push({
    categoria: 'Gabinete/Rack',
    nombre: 'Organizador horizontal de cables',
    cantidad: ruOrganizadores,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  materiales.push({
    categoria: 'Gabinete/Rack',
    nombre: 'Bandeja para gabinete',
    cantidad: ruBandeja,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  materiales.push({
    categoria: 'Gabinete/Rack',
    nombre: 'Panel de ventilación',
    cantidad: ruVentilacion,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  materiales.push({
    categoria: 'Gabinete/Rack',
    nombre: 'Regleta PDU para rack',
    cantidad: 1,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // =================== CANALIZACIÓN ===================
  const distanciaTotalCanalizacion = puntos.reduce((acc: number, p: PuntoRed) => {
    const dist = config?.modoAvanzado ? (p?.distancia ?? 30) : (config?.distanciaPromedio ?? 30);
    return acc + dist * (p?.cantidad ?? 0);
  }, 0);

  // Para simplificar usamos la distancia promedio * cantidad de rutas únicas
  // Asumimos que muchos cables van por la misma ruta
  const rutasUnicas = Math.ceil(Math.sqrt(totalPuntos)) + 1;
  const distanciaCanalizacion = (config?.modoAvanzado 
    ? Math.max(...puntos.map((p: PuntoRed) => p?.distancia ?? 30)) 
    : (config?.distanciaPromedio ?? 30)) * rutasUnicas;

  const nombreCanalizacion: Record<string, string> = {
    MT: 'Tubo Metálico (MT)',
    EMT: 'Tubo EMT',
    PVC: 'Tubo PVC',
    bandeja: 'Bandeja Portacables',
    canaleta: 'Canaleta',
    liquidtight: 'Tubo Flexible Liquidtight',
  };

  const tipoC = config?.tipoCanalizacion ?? 'EMT';

  // Rollos de tubo flexible: último tramo desde canalización principal hasta cada jack (~0.5m/punto)
  const rollosFlexible = Math.max(1, Math.ceil((totalPuntos * 0.5 * (1 + reservaMat)) / 25));

  if (tipoC === 'bandeja') {
    // Bandeja portacables
    const tramosBandeja = Math.ceil(distanciaCanalizacion / 2.4); // tramos de 2.4m
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Bandeja portacables 30cm x 2.4m',
      cantidad: Math.ceil(tramosBandeja * (1 + reservaMat)),
      unidad: 'tramo',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Soporte/varilla roscada para bandeja',
      cantidad: Math.ceil((distanciaCanalizacion / 1.5) * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Unión para bandeja',
      cantidad: Math.ceil(tramosBandeja * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Curva horizontal para bandeja',
      cantidad: Math.ceil(rutasUnicas * 2),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Rollo tubo flexible corrugado 3/4" (25m)',
      cantidad: rollosFlexible,
      unidad: 'rollo',
      precioUnit: 0,
      subtotal: 0,
    });
  } else if (tipoC === 'canaleta') {
    // Canaleta
    const tramosCanaleta = Math.ceil(distanciaCanalizacion / 2);
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Canaleta 40x25mm x 2m',
      cantidad: Math.ceil(tramosCanaleta * (1 + reservaMat)),
      unidad: 'tramo',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Accesorios canaleta (esquinas, uniones, tapas)',
      cantidad: Math.ceil(rutasUnicas * 4 * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Caja de registro para canaleta',
      cantidad: Math.ceil(distanciaCanalizacion / REGISTRO_CADA_MIN),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Rollo tubo flexible corrugado 3/4" (25m)',
      cantidad: rollosFlexible,
      unidad: 'rollo',
      precioUnit: 0,
      subtotal: 0,
    });
  } else if (tipoC === 'liquidtight') {
    // Rollo Flexible Liquidtight: se vende en rollos de 30m
    const metrosTotales = Math.ceil(distanciaCanalizacion * (1 + reservaMat));
    const rollos = Math.max(1, Math.ceil(metrosTotales / 30));
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Rollo Flexible Liquidtight 3/4" (30m)',
      cantidad: rollos,
      unidad: 'rollo',
      precioUnit: 0,
      subtotal: 0,
    });

    // Conectores para liquidtight: 2 por punto (entrada y salida de cada tramo)
    const conectoresLiquidtight = Math.ceil(totalPuntos * 2 * (1 + reservaMat));
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Conector para flexible Liquidtight 3/4"',
      cantidad: conectoresLiquidtight,
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });

    // Abrazaderas cada 1.5m para sujetar el rollo
    const abrazaderasLiq = Math.ceil(distanciaCanalizacion / ABRAZADERA_CADA * (1 + reservaMat));
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Abrazadera para tubo flexible 3/4"',
      cantidad: abrazaderasLiq,
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });

    const registrosLiq = Math.ceil(distanciaCanalizacion / REGISTRO_CADA_MIN);
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Registro eléctrico/caja de paso',
      cantidad: Math.max(registrosLiq, rutasUnicas),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
  } else {
    // Tubos MT, EMT, PVC
    const tubos = Math.ceil(distanciaCanalizacion / LONGITUD_TUBO);
    materiales.push({
      categoria: 'Canalización',
      nombre: `${nombreCanalizacion[tipoC] ?? tipoC} 3/4" x 3m`,
      cantidad: Math.ceil(tubos * (1 + reservaMat)),
      unidad: 'tramo',
      precioUnit: 0,
      subtotal: 0,
    });

    const abrazaderas = Math.ceil(distanciaCanalizacion / ABRAZADERA_CADA);
    materiales.push({
      categoria: 'Canalización',
      nombre: `Abrazadera para tubo 3/4"`,
      cantidad: Math.ceil(abrazaderas * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });

    const conectores = tubos;
    materiales.push({
      categoria: 'Canalización',
      nombre: `Conector para ${nombreCanalizacion[tipoC] ?? tipoC} 3/4"`,
      cantidad: Math.ceil(conectores * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });

    materiales.push({
      categoria: 'Canalización',
      nombre: `Curva para tubo 3/4"`,
      cantidad: Math.ceil(rutasUnicas * 3 * (1 + reservaMat)),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });

    const registros = Math.ceil(distanciaCanalizacion / REGISTRO_CADA_MIN);
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Registro eléctrico/caja de paso',
      cantidad: Math.max(registros, rutasUnicas),
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });

    // Tubo flexible corrugado: último tramo desde tubería rígida hasta cada jack (~0.5m/punto)
    const rollosFlexible = Math.max(1, Math.ceil((totalPuntos * 0.5 * (1 + reservaMat)) / 25));
    materiales.push({
      categoria: 'Canalización',
      nombre: 'Rollo tubo flexible corrugado 3/4" (25m)',
      cantidad: rollosFlexible,
      unidad: 'rollo',
      precioUnit: 0,
      subtotal: 0,
    });
  }

  // =================== CCTV ===================
  const camaras = puntosPorTipo['camara_ip'] ?? 0;
  if (camaras > 0) {
    materiales.push({
      categoria: 'CCTV',
      nombre: 'Cámara IP (PoE)',
      cantidad: camaras,
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    materiales.push({
      categoria: 'CCTV',
      nombre: 'Soporte para cámara',
      cantidad: camaras,
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
    if (camaras >= 4) {
      materiales.push({
        categoria: 'CCTV',
        nombre: 'NVR (grabador de video en red)',
        cantidad: 1,
        unidad: 'und',
        precioUnit: 0,
        subtotal: 0,
      });
      materiales.push({
        categoria: 'CCTV',
        nombre: 'Disco duro para NVR (2TB+)',
        cantidad: 1,
        unidad: 'und',
        precioUnit: 0,
        subtotal: 0,
      });
    }
  }

  // =================== ELECTRICIDAD/PROTECCIÓN ===================
  if (config?.incluyeUPS) {
    materiales.push({
      categoria: 'Electricidad/Protección',
      nombre: 'UPS Rack-mount',
      cantidad: 1,
      unidad: 'und',
      precioUnit: 0,
      subtotal: 0,
    });
  }
  materiales.push({
    categoria: 'Electricidad/Protección',
    nombre: 'Protector de voltaje',
    cantidad: 1,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });
  materiales.push({
    categoria: 'Electricidad/Protección',
    nombre: 'Toma corriente dedicada',
    cantidad: 2,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // =================== IDENTIFICACIÓN ===================
  materiales.push({
    categoria: 'Identificación',
    nombre: 'Etiquetas para cables',
    cantidad: totalPuntos * ETIQUETAS_POR_PUNTO,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });
  materiales.push({
    categoria: 'Identificación',
    nombre: 'Etiquetas para puertos (patch panel)',
    cantidad: totalPuntos,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });
  materiales.push({
    categoria: 'Identificación',
    nombre: 'Etiquetas para equipos',
    cantidad: switchesNecesarios + patchPanels + 2,
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });

  // =================== CONSUMIBLES ===================
  materiales.push({
    categoria: 'Consumibles',
    nombre: 'Tornillos y tarugos (kit)',
    cantidad: Math.ceil(totalPuntos * 4 * (1 + reservaMat)),
    unidad: 'und',
    precioUnit: 0,
    subtotal: 0,
  });
  materiales.push({
    categoria: 'Consumibles',
    nombre: 'Amarras plásticas (paquete 100)',
    cantidad: Math.ceil(totalPuntos / 10),
    unidad: 'paq',
    precioUnit: 0,
    subtotal: 0,
  });
  materiales.push({
    categoria: 'Consumibles',
    nombre: 'Velcro para organizar cables (rollo)',
    cantidad: Math.ceil(totalPuntos / 20) + 1,
    unidad: 'rollo',
    precioUnit: 0,
    subtotal: 0,
  });
  materiales.push({
    categoria: 'Consumibles',
    nombre: 'Cinta aislante (rollo)',
    cantidad: Math.ceil(totalPuntos / 15) + 1,
    unidad: 'rollo',
    precioUnit: 0,
    subtotal: 0,
  });

  // =================== ALERTAS ===================
  if ((config?.gabineteRU ?? 12) < ruTotal) {
    alertas.push({
      tipo: 'warning',
      mensaje: `El gabinete de ${config?.gabineteRU ?? 12}RU puede ser insuficiente. Se necesitan aproximadamente ${ruTotal}RU. Se recomienda un gabinete de al menos ${Math.ceil(ruTotal / 6) * 6}RU.`,
    });
  }

  if (puntosPoE > 0 && !config?.switchPoE) {
    alertas.push({
      tipo: 'warning',
      mensaje: `Hay ${puntosPoE} dispositivos que requieren PoE (cámaras IP, access points, teléfonos IP) pero el switch no tiene puertos PoE configurados.`,
    });
  }

  if (config?.switchPoE && puntosPoE > (config?.switchPuertosPoE ?? 0)) {
    alertas.push({
      tipo: 'warning',
      mensaje: `Se necesitan ${puntosPoE} puertos PoE pero solo hay ${config?.switchPuertosPoE ?? 0} configurados.`,
    });
  }

  if (!config?.incluyeUPS) {
    alertas.push({
      tipo: 'info',
      mensaje: 'Se recomienda incluir un UPS para proteger los equipos de red ante fallas eléctricas.',
    });
  }

  if (totalPuntos > 0) {
    alertas.push({
      tipo: 'success',
      mensaje: `Cálculo completado: ${totalPuntos} puertos de red, ${totalCajas} cajas de cable, ${switchesNecesarios} switch(es), ${patchPanels} patch panel(es).`,
    });
  }

  // Gabinete recomendado
  const ruRecomendado = Math.ceil(ruTotal / 6) * 6;
  alertas.push({
    tipo: 'info',
    mensaje: `Tamaño de gabinete recomendado: ${ruRecomendado}RU (espacio calculado: ${ruTotal}RU).`,
  });

  return {
    materiales,
    alertas,
    resumen: {
      totalPuntos,
      totalCableMetros: Math.round(totalCableMetros * 100) / 100,
      totalCajas,
      puntosPoE,
      ruEspacioNecesario: ruTotal,
    },
  };
}

export function calcularCotizacion(
  materiales: MaterialItem[],
  config: {
    itbis: number;
    margenGanancia: number;
    costoManoObra: number;
    costoTransporte: number;
    costoConfiguracion: number;
    costoCertificacion: number;
  }
) {
  const subtotalMateriales = materiales.reduce((acc: number, m: MaterialItem) => acc + (m?.subtotal ?? 0), 0);
  const margen = subtotalMateriales * ((config?.margenGanancia ?? 0) / 100);
  const subtotalConMargen = subtotalMateriales + margen;
  const costosAdicionales = (config?.costoManoObra ?? 0) + (config?.costoTransporte ?? 0) + (config?.costoConfiguracion ?? 0) + (config?.costoCertificacion ?? 0);
  const subtotalGeneral = subtotalConMargen + costosAdicionales;
  const itbisValor = subtotalGeneral * ((config?.itbis ?? 18) / 100);
  const totalGeneral = subtotalGeneral + itbisValor;

  return {
    subtotalMateriales: Math.round(subtotalMateriales * 100) / 100,
    margen: Math.round(margen * 100) / 100,
    subtotalConMargen: Math.round(subtotalConMargen * 100) / 100,
    costosAdicionales: Math.round(costosAdicionales * 100) / 100,
    subtotalGeneral: Math.round(subtotalGeneral * 100) / 100,
    itbisValor: Math.round(itbisValor * 100) / 100,
    totalGeneral: Math.round(totalGeneral * 100) / 100,
  };
}
