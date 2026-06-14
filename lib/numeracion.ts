import { prisma } from '@/lib/prisma';

export async function generarNumeroCotizacion(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `COT-${year}-`;
  const count = await prisma.project.count({
    where: { userId, numeroCotizacion: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

export async function generarNumeroFactura(userId: string): Promise<string> {
  // Contar todas las facturas con formato NCF (B01-XXXXXXXX) del usuario
  const projects = await prisma.project.findMany({
    where: { userId, numeroFactura: { not: null } },
    select: { numeroFactura: true },
  });
  const ncfPattern = /^B\d{2}-\d{8}$/;
  const count = projects.filter((p) => ncfPattern.test(p.numeroFactura ?? '')).length;
  const seq = String(count + 1).padStart(8, '0');
  return `B01-${seq}`;
}

export function calcularEstadoPago(totalCotizado: number, totalPagado: number): string {
  if (totalPagado <= 0) return 'pendiente';
  if (totalPagado >= totalCotizado) return 'pagado';
  return 'parcial';
}
