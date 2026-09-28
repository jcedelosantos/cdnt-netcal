export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { DEFINICIONES, areaSchema, estimar, nombresMateriales, type Area } from '@/lib/estimador';

async function usuarioActual() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

async function cargar(userId: string, area: Area) {
  const config =
    (await prisma.estimadorConfig.findUnique({ where: { userId_area: { userId, area } }, include: { materiales: true } })) ??
    (await prisma.estimadorConfig.create({ data: { userId, area }, include: { materiales: true } }));

  const mapa = new Map(config.materiales.map((m) => [m.materialNombre, m]));
  const materiales = nombresMateriales(area).map((nombre) => ({
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

  const { ejemplo: muestra } = DEFINICIONES[area];
  const ejemplo = await estimar(area, muestra.entrada, { soloActivo: false });

  const { materiales: _m, ...resto } = config;
  return {
    config: resto,
    materiales,
    referencias,
    solicitudes,
    ejemplo: ejemplo && {
      texto: muestra.texto,
      minimo: ejemplo.minimo,
      maximo: ejemplo.maximo,
      total: ejemplo.total,
      costoMateriales: ejemplo.costoMateriales,
      sinPrecio: ejemplo.sinPrecio,
    },
  };
}

export async function GET(req: Request) {
  const userId = await usuarioActual();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const area = areaSchema.safeParse(new URL(req.url).searchParams.get('area') ?? 'cctv');
  if (!area.success) return NextResponse.json({ error: 'Área inválida' }, { status: 400 });
  return NextResponse.json(await cargar(userId, area.data));
}

const numero = z.coerce.number().min(0).max(10_000_000);
const putSchema = z.object({
  area: areaSchema,
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
  const { materiales, area, ...campos } = parsed.data;

  // Solo puede haber un estimador activo por área
  if (campos.activo) {
    await prisma.estimadorConfig.updateMany({ where: { area, userId: { not: userId } }, data: { activo: false } });
  }
  const config = await prisma.estimadorConfig.upsert({
    where: { userId_area: { userId, area } },
    create: { userId, area, ...campos },
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
  return NextResponse.json(await cargar(userId, area));
}
