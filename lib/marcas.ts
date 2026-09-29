// Elige, para un material de la cotización, el precio de referencia de la marca seleccionada.
// Regla: mismo tipo de equipo y, entre los que cumplen, el más barato (en switches, el de menos
// puertos que alcance). El usuario puede cambiar el precio después.

export type ReferenciaMarca = { nombre: string; categoria: string | null; precio: number };

type Tipo = 'Firewall' | 'Switch' | 'Cámara' | 'NVR/DVR' | 'Access point' | 'Central telefónica' | 'Teléfono IP' | 'Router/Gateway';

// Tipo de equipo según el nombre (materiales del cálculo o precios sin categoría)
function tipoPorNombre(nombre: string): Tipo | null {
  const n = nombre.toLowerCase();
  if (/soporte|disco|m[oó]dulo|base dect|antena|configuraci|servicio/.test(n)) return null;
  if (/firewall|fortigate|licencia/.test(n)) return /licencia/.test(n) ? null : 'Firewall';
  if (/switch/.test(n)) return 'Switch';
  if (/\bnvr\b|\bdvr\b|grabador|video recorder/.test(n)) return 'NVR/DVR';
  if (/c[aá]mara|camera/.test(n)) return 'Cámara';
  if (/access point|\bap\b/.test(n)) return 'Access point';
  if (/central|\bpbx\b|\bucm/.test(n)) return 'Central telefónica';
  if (/tel[eé]fono|phone/.test(n)) return 'Teléfono IP';
  if (/router|gateway/.test(n)) return 'Router/Gateway';
  return null;
}

const TIPOS: Tipo[] = ['Firewall', 'Switch', 'Cámara', 'NVR/DVR', 'Access point', 'Central telefónica', 'Teléfono IP', 'Router/Gateway'];

function tipoReferencia(ref: ReferenciaMarca): Tipo | null {
  if (ref.categoria && (TIPOS as string[]).includes(ref.categoria)) return ref.categoria as Tipo;
  return tipoPorNombre(ref.nombre);
}

// "Switch 24 puertos", "1930 24G", "8P/G" → 24, 24, 8
function puertos(nombre: string): number | null {
  const m = nombre.match(/(\d+)\s*(?:puertos|port|p\b|g\b)/i);
  return m ? Number(m[1]) : null;
}
const esPoe = (nombre: string) => /poe|\d+\s*w\b/i.test(nombre);
const esExterior = (nombre: string) => /exterior|outdoor/i.test(nombre);

export function elegirReferencia(materialNombre: string, refs: ReferenciaMarca[]): ReferenciaMarca | null {
  const tipo = tipoPorNombre(materialNombre);
  if (!tipo) return null;
  let candidatos = refs.filter((r) => tipoReferencia(r) === tipo && r.precio > 0);

  if (tipo === 'Access point' || tipo === 'Cámara') {
    const exterior = esExterior(materialNombre);
    const mismos = candidatos.filter((r) => esExterior(r.nombre) === exterior);
    if (mismos.length > 0) candidatos = mismos;
  }

  if (tipo === 'Switch') {
    const necesarios = puertos(materialNombre) ?? 0;
    if (esPoe(materialNombre)) candidatos = candidatos.filter((r) => esPoe(r.nombre));
    candidatos = candidatos.filter((r) => (puertos(r.nombre) ?? 0) >= necesarios);
    candidatos.sort((a, b) => (puertos(a.nombre) ?? 0) - (puertos(b.nombre) ?? 0) || a.precio - b.precio);
    return candidatos[0] ?? null;
  }

  candidatos.sort((a, b) => a.precio - b.precio);
  return candidatos[0] ?? null;
}
