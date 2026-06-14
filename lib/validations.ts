import { z } from 'zod';

// Equipment
export const equipmentSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  tipoEquipo: z.string().optional(),
  fabricante: z.string().optional(),
  numeroSerie: z.string().optional(),
  direccionIp: z.string().ip().optional().or(z.literal('')),
  direccionMac: z.string().optional(),
  fechaCompra: z.string().datetime().optional().or(z.literal('')),
  garantia: z.string().datetime().optional().or(z.literal('')),
  estado: z.enum(['activo', 'inactivo', 'mantenimiento']).default('activo'),
  responsable: z.string().optional(),
  costoUsd: z.number().min(0).default(0),
  clientId: z.string().optional(),
  comentarios: z.string().optional(),
});

// License
export const licenseSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.string().optional(),
  proveedor: z.string().optional(),
  fechaInicio: z.string().datetime().optional().or(z.literal('')),
  fechaVencimiento: z.string().datetime().optional().or(z.literal('')),
  costoAnual: z.number().min(0).default(0),
  responsable: z.string().optional(),
  estado: z.enum(['activa', 'vencida', 'por_vencer']).default('activa'),
  notas: z.string().optional(),
  clientId: z.string().optional(),
});

// Monthly Consumption
export const consumptionSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.string().optional(),
  costoMensual: z.number().min(0).default(0),
  responsable: z.string().optional(),
  proveedor: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  notas: z.string().optional(),
  clientId: z.string().optional(),
});

// Third Party Support
export const supportSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  servicios: z.string().optional(),
  costoMensual: z.number().min(0).default(0),
  costoAnual: z.number().min(0).default(0),
  contrato: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido']).default('activo'),
  clientId: z.string().optional(),
});

// IT Project
export const projectSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  estado: z.enum(['en_progreso', 'completado', 'pausado', 'cancelado']).default('en_progreso'),
  responsable: z.string().optional(),
  presupuesto: z.number().min(0).default(0),
  avance: z.number().min(0).max(100).default(0),
  fechaInicio: z.string().datetime().optional().or(z.literal('')),
  fechaFin: z.string().datetime().optional().or(z.literal('')),
  notas: z.string().optional(),
  clientId: z.string().optional(),
});

// Client
export const clientSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  direccion: z.string().optional(),
  activo: z.boolean().default(true),
  notas: z.string().optional(),
});

// Auth
export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  name: z.string().min(1, 'Nombre requerido'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type Equipment = z.infer<typeof equipmentSchema>;
export type License = z.infer<typeof licenseSchema>;
export type Consumption = z.infer<typeof consumptionSchema>;
export type Support = z.infer<typeof supportSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Signup = z.infer<typeof signupSchema>;
export type Login = z.infer<typeof loginSchema>;
