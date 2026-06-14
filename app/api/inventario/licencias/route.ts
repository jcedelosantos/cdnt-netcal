export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { licenseSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { proveedor: { contains: search, mode: 'insensitive' } },
      ];
    }
    const items = await prisma.inventoryLicense.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener licencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const body = await request.json();
    const validated = licenseSchema.parse(body);
    const item = await prisma.inventoryLicense.create({ data: validated });
    return NextResponse.json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}
