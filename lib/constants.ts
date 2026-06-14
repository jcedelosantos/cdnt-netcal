// Equipment types
export const TIPOS_EQUIPO = [
  { value: 'computadora', label: 'Computadora' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'servidor', label: 'Servidor' },
  { value: 'impresora', label: 'Impresora' },
  { value: 'camara', label: 'Cámara' },
  { value: 'repetidor', label: 'Repetidor' },
  { value: 'otro', label: 'Otro' },
];

// Equipment states
export const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'mantenimiento', label: 'En Mantenimiento' },
];

// License states
export const ESTADOS_LICENCIA = [
  { value: 'activa', label: 'Activa' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'por_vencer', label: 'Por Vencer' },
];

// Consumption states
export const ESTADOS_CONSUMO = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

// Support states
export const ESTADOS_SOPORTE = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
];

// Project states
export const ESTADOS_PROYECTO = [
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'cancelado', label: 'Cancelado' },
];

// Helper function to get label
export function getLabel(
  value: string,
  options: Array<{ value: string; label: string }>,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
