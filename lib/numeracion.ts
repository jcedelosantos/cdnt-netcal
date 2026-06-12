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
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  const count = await prisma.project.count({
    where: { userId, numeroFactura: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

export function calcularEstadoPago(totalCotizado: number, totalPagado: number): string {
  if (totalPagado <= 0) return 'pendiente';
  if (totalPagado >= totalCotizado) return 'pagado';
  return 'parcial';
}
