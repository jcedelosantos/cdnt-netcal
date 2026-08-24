export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const { name, email, passwordActual, passwordNuevo } = await req.json();

    const user = await withRetry(() => prisma.user.findUnique({ where: { id: userId } }));
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const data: any = {};

    if (name?.trim()) data.name = name.trim();
    if (email?.trim()) data.email = email.trim();

    if (passwordNuevo) {
      if (!passwordActual) return NextResponse.json({ error: 'Debes ingresar tu contraseña actual' }, { status: 400 });
      const ok = await bcrypt.compare(passwordActual, user.password ?? '');
      if (!ok) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
      data.password = await bcrypt.hash(passwordNuevo, 10);
    }

    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });

    await withRetry(() => prisma.user.update({ where: { id: userId }, data }));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('PUT cuenta error:', error);
    return NextResponse.json({ error: 'Error al actualizar cuenta' }, { status: 500 });
  }
}
