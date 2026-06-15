export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search') || '';
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { contacto: { contains: search, mode: 'insensitive' } },
        { servicios: { contains: search, mode: 'insensitive' } },
      ];
    }
    const items = await prisma.inventoryThirdPartySupport.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener soportes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const body = await request.json();
    const item = await prisma.inventoryThirdPartySupport.create({ data: body });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}
