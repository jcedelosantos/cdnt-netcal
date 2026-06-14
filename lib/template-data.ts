// Datos de plantillas precargadas por categoría

export const TEMPLATE_CATEGORIES = {
  THIRD_PARTY_SUPPORT: 'soportes_tercerizados',
  IT_PROJECTS: 'proyectos_curso',
  LICENSES: 'licencias_anuales',
  CONSUMPTIONS: 'consumos_mensuales',
} as const;

// Soportes Tercerizados
export const THIRD_PARTY_SUPPORT_TEMPLATES = [
  {
    nombre: 'Orlando / Software ICG',
    contacto: 'Orlando',
    servicios: 'Soporte de software ICG',
    costoMensual: 0,
    costoAnual: 0,
    estado: 'activo',
  },
  {
    nombre: 'Javis / Hardware',
    contacto: 'Javis',
    servicios: 'Soporte de hardware',
    costoMensual: 0,
    costoAnual: 0,
    estado: 'activo',
  },
];

// Proyectos en Curso
export const IT_PROJECT_TEMPLATES = [
  {
    nombre: 'Data lake',
    descripcion: 'Implementación de Data lake',
    estado: 'en_progreso',
    presupuesto: 0,
    avance: 0,
  },
  {
    nombre: 'Resolución puntos ICG',
    descripcion: 'Resolución de puntos con ICG',
    estado: 'en_progreso',
    presupuesto: 0,
    avance: 0,
  },
  {
    nombre: 'Migración a nueva plataforma',
    descripcion: 'Migración de sistemas a nueva plataforma',
    estado: 'en_progreso',
    presupuesto: 0,
    avance: 0,
  },
  {
    nombre: 'Nueva plataforma nómina',
    descripcion: 'Implementación de nueva plataforma de nómina',
    estado: 'en_progreso',
    presupuesto: 0,
    avance: 0,
  },
];

// Licencias Anuales
export const LICENSE_TEMPLATES = [
  {
    nombre: 'ICG',
    categoria: 'Software',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Bookifi app profesionales',
    categoria: 'Software',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'App reverse Adm pro Bookifi',
    categoria: 'Software',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Office',
    categoria: 'Productividad',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Antivirus',
    categoria: 'Seguridad',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Windows remote',
    categoria: 'Software',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Servidor nube',
    categoria: 'Infraestructura',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Facturación Electrónica',
    categoria: 'Software',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Licencias software nómina',
    categoria: 'Software',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Publicidad Instagram',
    categoria: 'Marketing',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Soporte y asistencia ponchador',
    categoria: 'Soporte',
    costoAnual: 0,
    estado: 'activa',
  },
  {
    nombre: 'Pago de dominio anual',
    categoria: 'Infraestructura',
    costoAnual: 0,
    estado: 'activa',
  },
];

// Consumos Mensuales
export const MONTHLY_CONSUMPTION_TEMPLATES = [
  {
    nombre: 'Uso de mensajería WhatsApp',
    categoria: 'Comunicaciones',
    costoMensual: 0,
    estado: 'activo',
  },
  {
    nombre: 'Licencias de Spotify',
    categoria: 'Suscripciones',
    costoMensual: 0,
    estado: 'activo',
  },
  {
    nombre: 'Licencias de Power BI',
    categoria: 'Software',
    costoMensual: 0,
    estado: 'activo',
  },
];

// Mapeo para fácil acceso
export const TEMPLATES = {
  [TEMPLATE_CATEGORIES.THIRD_PARTY_SUPPORT]: {
    label: 'Soportes Tercerizados',
    icon: 'Users',
    color: 'blue',
    data: THIRD_PARTY_SUPPORT_TEMPLATES,
  },
  [TEMPLATE_CATEGORIES.IT_PROJECTS]: {
    label: 'Proyectos en Curso',
    icon: 'Rocket',
    color: 'purple',
    data: IT_PROJECT_TEMPLATES,
  },
  [TEMPLATE_CATEGORIES.LICENSES]: {
    label: 'Licencias Anuales',
    icon: 'Shield',
    color: 'green',
    data: LICENSE_TEMPLATES,
  },
  [TEMPLATE_CATEGORIES.CONSUMPTIONS]: {
    label: 'Consumos Mensuales',
    icon: 'TrendingUp',
    color: 'orange',
    data: MONTHLY_CONSUMPTION_TEMPLATES,
  },
};
