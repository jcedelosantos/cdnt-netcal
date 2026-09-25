export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { estimarCctv, nombresMaterialesCctv } from '@/lib/estimador';

async function usuarioActual() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

async function cargar(userId: string) {
  const config =
    (await prisma.estimadorConfig.findUnique({ where: { userId }, include: { materiales: true } })) ??
    (await prisma.estimadorConfig.create({ data: { userId }, include: { materiales: true } }));

  const mapa = new Map(config.materiales.map((m) => [m.materialNombre, m]));
  const materiales = nombresMaterialesCctv().map((nombre) => ({
    materialNombre: nombre,
    referenciaNombre: mapa.get(nombre)?.referenciaNombre ?? null,
    incluir: mapa.get(nombre)?.incluir ?? true,
  }));

  const referencias = await prisma.precioReferencia.findMany({
    where: { userId },
    distinct: ['nombre'],
    orderBy: [{ nombre: 'asc' }, { fecha: 'desc' }],
    select: { nombre: true, precio: true, fecha: true },
  });

  const solicitudes = await prisma.project.findMany({
    where: { userId, origen: 'web' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, nombre: true, cliente: true, createdAt: true, aprobado: true },
  });

  // Ejemplo de referencia: 8 cámaras, distancia media, interior
  const ejemplo = await estimarCctv({ camaras: 8, distancia: 'media', instalacion: 'interior' }, { soloActivo: false });

  const { materiales: _m, ...resto } = config;
  return {
    config: resto,
    materiales,
    referencias,
    solicitudes,
    ejemplo: ejemplo && {
      minimo: ejemplo.minimo,
      maximo: ejemplo.maximo,
      total: ejemplo.total,
      costoMateriales: ejemplo.costoMateriales,
      sinPrecio: ejemplo.sinPrecio,
    },
  };
}

export async function GET() {
  const userId = await usuarioActual();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json(await cargar(userId));
}

const numero = z.coerce.number().min(0).max(10_000_000);
const putSchema = z.object({
  activo: z.boolean(),
  margen: numero,
  rangoPct: z.coerce.number().min(0).max(50),
  manoObraPorCamara: numero,
  costoFijo: numero,
  itbis: z.coerce.number().min(0).max(100),
  materiales: z.array(
    z.object({
      materialNombre: z.string().min(1).max(200),
      referenciaNombre: z.string().max(200).nullable(),
      incluir: z.boolean(),
    })
  ),
});

export async function PUT(req: Request) {
  const userId = await usuarioActual();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { materiales, ...campos } = parsed.data;

  // Solo puede haber un estimador activo
  if (campos.activo) {
    await prisma.estimadorConfig.updateMany({ where: { userId: { not: userId } }, data: { activo: false } });
  }
  const config = await prisma.estimadorConfig.upsert({
    where: { userId },
    create: { userId, ...campos },
    update: campos,
  });
  await prisma.$transaction(
    materiales.map((m) =>
      prisma.estimadorMaterial.upsert({
        where: { configId_materialNombre: { configId: config.id, materialNombre: m.materialNombre } },
        create: { configId: config.id, ...m, referenciaNombre: m.referenciaNombre || null },
        update: { referenciaNombre: m.referenciaNombre || null, incluir: m.incluir },
      })
    )
  );
  return NextResponse.json(await cargar(userId));
}
