export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Maps general inventory categories to TIC category names
const CAT_LICENCIAS = 'Licencias de Software';
const CAT_SOPORTES  = 'Soportes Tercerizados';
const CAT_CONSUMOS  = 'Consumos Mensuales';
const CAT_PROYECTOS = 'Proyectos TI';

async function upsertCategory(inventarioId: string, nombre: string, orden: number) {
  let cat = await prisma.ticCategory.findFirst({ where: { inventarioId, nombre } });
  if (!cat) {
    cat = await prisma.ticCategory.create({
      data: { inventarioId, nombre, orden },
    });
  }
  return cat;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = (session.user as any).id;
  const inventarioId = params.id;

  // Verify ownership
  const inventario = await prisma.ticInventario.findFirst({
    where: { id: inventarioId, userId },
  });
  if (!inventario) return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });

  const clientId = inventario.clientId;

  // Fetch all general inventory data for this client
  const [licencias, soportes, consumos, proyectos] = await Promise.all([
    prisma.inventoryLicense.findMany({ where: { clientId } }),
    prisma.inventoryThirdPartySupport.findMany({ where: { clientId } }),
    prisma.inventoryMonthlyConsumption.findMany({ where: { clientId } }),
    prisma.inventoryITProject.findMany({ where: { clientId } }),
  ]);

  let agregados = 0;
  let omitidos = 0;

  // Helper: add article if not already present in the category
  async function syncArticulo(categoriaId: string, nombre: string, data: {
    cantidad?: number;
    precioUnitario?: number;
    proveedor?: string | null;
    fechaVencimiento?: Date | null;
    descripcion?: string | null;
    notas?: string | null;
  }) {
    const existe = await prisma.ticArticle.findFirst({ where: { categoriaId, nombre } });
    if (existe) { omitidos++; return; }
    const cantidad = data.cantidad ?? 1;
    const precioUnitario = data.precioUnitario ?? 0;
    await prisma.ticArticle.create({
      data: {
        categoriaId,
        nombre,
        cantidad,
        precioUnitario,
        subtotal: cantidad * precioUnitario,
        proveedor: data.proveedor ?? undefined,
        fechaVencimiento: data.fechaVencimiento ?? undefined,
        descripcion: data.descripcion ?? undefined,
        notas: data.notas ?? undefined,
      },
    });
    agregados++;
  }

  // Sync Licencias
  if (licencias.length > 0) {
    const cat = await upsertCategory(inventarioId, CAT_LICENCIAS, 0);
    for (const lic of licencias) {
      await syncArticulo(cat.id, lic.nombre, {
        cantidad: 1,
        precioUnitario: lic.costoAnual ?? 0,
        proveedor: lic.proveedor,
        fechaVencimiento: lic.fechaVencimiento,
        notas: lic.estado !== 'activa' ? `Estado: ${lic.estado}` : undefined,
      });
    }
  }

  // Sync Soportes
  if (soportes.length > 0) {
    const cat = await upsertCategory(inventarioId, CAT_SOPORTES, 1);
    for (const s of soportes) {
      await syncArticulo(cat.id, s.nombre, {
        cantidad: 1,
        precioUnitario: s.costoAnual ?? (s.costoMensual ?? 0) * 12,
        proveedor: s.contacto,
        descripcion: s.servicios,
      });
    }
  }

  // Sync Consumos
  if (consumos.length > 0) {
    const cat = await upsertCategory(inventarioId, CAT_CONSUMOS, 2);
    for (const c of consumos) {
      await syncArticulo(cat.id, c.nombre, {
        cantidad: 12,
        precioUnitario: c.costoMensual ?? 0,
        proveedor: c.proveedor,
        notas: c.notas,
      });
    }
  }

  // Sync Proyectos
  if (proyectos.length > 0) {
    const cat = await upsertCategory(inventarioId, CAT_PROYECTOS, 3);
    for (const p of proyectos) {
      await syncArticulo(cat.id, p.nombre, {
        cantidad: 1,
        precioUnitario: p.presupuesto ?? 0,
        descripcion: p.descripcion,
        notas: p.estado,
      });
    }
  }

  // Recalculate gastoTotal per category and gastoAnual of the inventario
  const cats = await prisma.ticCategory.findMany({
    where: { inventarioId },
    include: { articulos: true },
  });

  let gastoAnual = 0;
  for (const cat of cats) {
    const gastoTotal = cat.articulos.reduce((s, a) => s + (a.subtotal ?? 0), 0);
    await prisma.ticCategory.update({ where: { id: cat.id }, data: { gastoTotal } });
    gastoAnual += gastoTotal;
  }
  await prisma.ticInventario.update({ where: { id: inventarioId }, data: { gastoAnual } });

  return NextResponse.json({
    ok: true,
    agregados,
    omitidos,
    categorias: cats.length,
    message: `${agregados} artículos agregados, ${omitidos} ya existían`,
  });
}
