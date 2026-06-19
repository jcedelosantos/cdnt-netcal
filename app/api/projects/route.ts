export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { calcularMateriales, type ConfigProyecto } from '@/lib/calculations';
import { generarNumeroCotizacion } from '@/lib/numeracion';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const cliente = searchParams.get('cliente') ?? '';
    const estado = searchParams.get('estado') ?? ''; // 'aprobados' | 'pendientes' | ''
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    const where: any = { userId };
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { cliente: { contains: search } },
      ];
    }
    if (cliente) where.cliente = cliente;
    if (estado === 'aprobados') where.aprobado = true;
    else if (estado === 'pendientes') where.aprobado = false;
    else if (estado === 'facturados') where.numeroFactura = { not: null };
    else if (estado === 'pagados') where.estadoPago = 'pagado';
    else if (estado === 'pago_parcial') where.estadoPago = 'parcial';

    const [projects, total, clientesRaw] = await withRetry(() => Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { puntos: true },
      }),
      prisma.project.count({ where }),
      // Lista de clientes únicos del usuario (para el filtro)
      prisma.project.findMany({
        where: { userId, cliente: { not: null } },
        select: { cliente: true },
        distinct: ['cliente'],
        orderBy: { cliente: 'asc' },
      }),
    ]));

    const data = projects.map((p: any) => ({
      ...(p ?? {}),
      fecha: p?.fecha?.toISOString?.() ?? null,
      createdAt: p?.createdAt?.toISOString?.() ?? null,
      updatedAt: p?.updatedAt?.toISOString?.() ?? null,
      totalPuntos: (p?.puntos ?? []).reduce((acc: number, pt: any) => acc + (pt?.cantidad ?? 0), 0),
    }));

    const clientes = (clientesRaw ?? [])
      .map((c: any) => c?.cliente)
      .filter((c: any) => c && String(c).trim() !== '');

    return NextResponse.json({ data, total, page, limit, clientes });
  } catch (error: any) {
    console.error('GET projects error:', error);
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

    const body = await req.json();
    const {
      nombre, cliente, clienteNombre, inventoryClientId, clienteRNC, ubicacion, fecha,
      modoAvanzado, tipoInstalacion, tipoCanalización, categoriaCable,
      distanciaPromedio, reservaCable, reservaMateriales,
      switchPuertos, switchPoE, switchPuertosPoE, gabineteRU,
      incluyeUPS, incluyeCotizacion, margenGanancia, costoManoObra,
      costoTransporte, costoConfiguracion, costoCertificacion, itbis,
      notas, puntos,
    } = body ?? {};

    // Resolve inventory client: use existing ID or create new from name
    let resolvedClientId = inventoryClientId ?? null;
    let resolvedClientName = cliente ?? null;
    if (!resolvedClientId && (clienteNombre ?? cliente)?.trim()) {
      const nameToUse = (clienteNombre ?? cliente).trim();
      // Find or create InventoryClient
      let ic = await prisma.inventoryClient.findFirst({
        where: { userId, nombre: nameToUse },
      });
      if (!ic) {
        ic = await prisma.inventoryClient.create({
          data: { userId, nombre: nameToUse, activo: true },
        });
      }
      resolvedClientId = ic.id;
      resolvedClientName = ic.nombre;
    } else if (resolvedClientId) {
      const ic = await prisma.inventoryClient.findUnique({ where: { id: resolvedClientId } });
      resolvedClientName = ic?.nombre ?? resolvedClientName;
    }

    // Número de cotización automático (COT-AAAA-NNN)
    const numeroCotizacion = await generarNumeroCotizacion(userId);

    // Crear proyecto
    const project = await withRetry(() => prisma.project.create({
      data: {
        userId,
        numeroCotizacion,
        nombre: nombre ?? 'Proyecto sin nombre',
        cliente: resolvedClientName,
        inventoryClientId: resolvedClientId,
        clienteRNC: clienteRNC ?? null,
        ubicacion: ubicacion ?? null,
        fecha: fecha ? new Date(fecha) : new Date(),
        modoAvanzado: modoAvanzado ?? false,
        tipoInstalacion: tipoInstalacion ?? 'expuesta',
        tipoCanalización: tipoCanalización ?? 'EMT',
        categoriaCable: categoriaCable ?? 'Cat6',
        distanciaPromedio: distanciaPromedio ?? 30,
        reservaCable: reservaCable ?? 15,
        reservaMateriales: reservaMateriales ?? 10,
        switchPuertos: switchPuertos ?? 24,
        switchPoE: switchPoE ?? false,
        switchPuertosPoE: switchPuertosPoE ?? 0,
        gabineteRU: gabineteRU ?? 12,
        incluyeUPS: incluyeUPS ?? false,
        incluyeCotizacion: incluyeCotizacion ?? false,
        margenGanancia: margenGanancia ?? 0,
        costoManoObra: costoManoObra ?? 0,
        costoTransporte: costoTransporte ?? 0,
        costoConfiguracion: costoConfiguracion ?? 0,
        costoCertificacion: costoCertificacion ?? 0,
        itbis: itbis ?? 18,
        notas: notas ?? null,
        puntos: {
          create: (puntos ?? []).map((p: any) => ({
            tipo: p?.tipo ?? 'datos',
            cantidad: p?.cantidad ?? 1,
            distancia: p?.distancia ?? 30,
          })),
        },
      },
      include: { puntos: true },
    }));

    // Calcular materiales
    const config: ConfigProyecto = {
      puntos: (project?.puntos ?? []).map((p: any) => ({
        tipo: p?.tipo ?? 'datos',
        cantidad: p?.cantidad ?? 0,
        distancia: p?.distancia ?? 30,
      })),
      categoriaCable: project?.categoriaCable ?? 'Cat6',
      tipoInstalacion: project?.tipoInstalacion ?? 'expuesta',
      tipoCanalizacion: project?.tipoCanalización ?? 'EMT',
      reservaCable: project?.reservaCable ?? 15,
      reservaMateriales: project?.reservaMateriales ?? 10,
      switchPuertos: project?.switchPuertos ?? 24,
      switchPoE: project?.switchPoE ?? false,
      switchPuertosPoE: project?.switchPuertosPoE ?? 0,
      gabineteRU: project?.gabineteRU ?? 12,
      incluyeUPS: project?.incluyeUPS ?? false,
      distanciaPromedio: project?.distanciaPromedio ?? 30,
      modoAvanzado: project?.modoAvanzado ?? false,
    };

    const resultado = calcularMateriales(config);

    // Guardar materiales
    if ((resultado?.materiales?.length ?? 0) > 0) {
      await prisma.projectMaterial.deleteMany({ where: { projectId: project.id } });
      await prisma.projectMaterial.createMany({
        data: (resultado?.materiales ?? []).map((m: any) => ({
          projectId: project.id,
          categoria: m?.categoria ?? '',
          nombre: m?.nombre ?? '',
          cantidad: m?.cantidad ?? 0,
          unidad: m?.unidad ?? 'und',
          precioUnit: m?.precioUnit ?? 0,
          subtotal: m?.subtotal ?? 0,
        })),
      });
    }

    return NextResponse.json({
      project: {
        ...(project ?? {}),
        fecha: project?.fecha?.toISOString?.() ?? null,
        createdAt: project?.createdAt?.toISOString?.() ?? null,
        updatedAt: project?.updatedAt?.toISOString?.() ?? null,
      },
      resultado,
    });
  } catch (error: any) {
    console.error('POST project error:', error);
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }
}
