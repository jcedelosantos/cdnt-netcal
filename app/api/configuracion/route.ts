export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';

const CAMPOS = ['empresaNombre', 'empresaRNC', 'empresaTelefono', 'empresaDireccion', 'empresaEmail', 'empresaLogo'] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const user = await withRetry(() => prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true, email: true,
        empresaNombre: true, empresaRNC: true, empresaTelefono: true,
        empresaDireccion: true, empresaEmail: true, empresaLogo: true,
      },
    }));
    return NextResponse.json({ config: user ?? {} });
  } catch (error: any) {
    console.error('GET configuracion error:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const body = await req.json();
    const data: any = {};
    for (const f of CAMPOS) {
      if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f];
    }

    const user = await withRetry(() => prisma.user.update({
      where: { id: userId },
      data,
      select: {
        empresaNombre: true, empresaRNC: true, empresaTelefono: true,
        empresaDireccion: true, empresaEmail: true, empresaLogo: true,
      },
    }));
    return NextResponse.json({ config: user });
  } catch (error: any) {
    console.error('PUT configuracion error:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
