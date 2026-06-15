export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

interface RowData {
  cliente: string;
  inventario_nombre: string;
  inventario_fecha?: string;
  inventario_estado?: string;
  inventario_descripcion?: string;
  categoria: string;
  articulo_nombre: string;
  articulo_descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  proveedor?: string;
  fecha_vencimiento?: string;
  notas?: string;
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNum(val: any): number {
  const n = parseFloat(String(val ?? '0').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function cellStr(cell: ExcelJS.Cell): string {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object' && 'text' in (cell.value as any))
    return String((cell.value as any).text).trim();
  return String(cell.value).trim();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);

    const ws = wb.worksheets[0];
    if (!ws) return NextResponse.json({ error: 'Archivo sin hojas' }, { status: 400 });

    // Leer encabezados de la primera fila
    const headers: string[] = [];
    ws.getRow(1).eachCell(cell => {
      headers.push(String(cell.value ?? '').toLowerCase().trim().replace(/\s+/g, '_'));
    });

    const REQUIRED = ['cliente', 'inventario_nombre', 'categoria', 'articulo_nombre', 'cantidad', 'precio_unitario'];
    const missing = REQUIRED.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Columnas faltantes: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const col = (name: string) => headers.indexOf(name);

    // Parsear filas
    const rows: RowData[] = [];
    const errors: string[] = [];

    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // skip header
      const vals = (row as any).values as any[]; // 1-indexed

      const get = (name: string) => {
        const idx = col(name);
        if (idx < 0) return undefined;
        const cell = row.getCell(idx + 1);
        return cellStr(cell);
      };

      const cliente = get('cliente') ?? '';
      const inv_nombre = get('inventario_nombre') ?? '';
      const cat = get('categoria') ?? '';
      const art = get('articulo_nombre') ?? '';

      if (!cliente || !inv_nombre || !cat || !art) {
        if (cliente || inv_nombre || cat || art) {
          errors.push(`Fila ${rowNum}: faltan campos obligatorios`);
        }
        return; // skip blank rows
      }

      rows.push({
        cliente,
        inventario_nombre: inv_nombre,
        inventario_fecha: get('inventario_fecha'),
        inventario_estado: get('inventario_estado') || 'borrador',
        inventario_descripcion: get('inventario_descripcion'),
        categoria: cat,
        articulo_nombre: art,
        articulo_descripcion: get('articulo_descripcion'),
        cantidad: parseNum(get('cantidad')),
        precio_unitario: parseNum(get('precio_unitario')),
        proveedor: get('proveedor'),
        fecha_vencimiento: get('fecha_vencimiento'),
        notas: get('notas'),
      });
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No se encontraron filas con datos' }, { status: 400 });
    }

    // Agrupar por cliente + inventario_nombre + inventario_fecha
    const groups = new Map<string, RowData[]>();
    for (const row of rows) {
      const key = `${row.cliente}||${row.inventario_nombre}||${row.inventario_fecha ?? ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    // Cache de clientes para no crear duplicados
    const clientCache = new Map<string, string>();

    const creados: { nombre: string; cliente: string; categorias: number; articulos: number }[] = [];

    for (const [, filas] of groups) {
      const first = filas[0];

      // Resolver cliente
      const nombreCliente = first.cliente.trim();
      let clientId = clientCache.get(nombreCliente.toLowerCase());
      if (!clientId) {
        let ic = await prisma.inventoryClient.findFirst({
          where: { userId, nombre: { equals: nombreCliente } },
        });
        if (!ic) {
          ic = await prisma.inventoryClient.create({
            data: { userId, nombre: nombreCliente, activo: true },
          });
        }
        clientId = ic.id;
        clientCache.set(nombreCliente.toLowerCase(), clientId);
      }

      // Crear inventario
      const estado = ['borrador', 'completado', 'archivado'].includes(first.inventario_estado ?? '')
        ? first.inventario_estado!
        : 'borrador';

      const inventario = await prisma.ticInventario.create({
        data: {
          userId,
          clientId,
          nombre: first.inventario_nombre.trim(),
          descripcion: first.inventario_descripcion || null,
          fecha: parseDate(first.inventario_fecha),
          estado,
          gastoAnual: 0,
        },
      });

      // Agrupar artículos por categoría
      const catMap = new Map<string, RowData[]>();
      for (const f of filas) {
        const catKey = f.categoria.trim();
        if (!catMap.has(catKey)) catMap.set(catKey, []);
        catMap.get(catKey)!.push(f);
      }

      let totalGastoAnual = 0;
      let orden = 0;

      for (const [catNombre, arts] of catMap) {
        const gastoCategoria = arts.reduce((sum, a) => sum + a.cantidad * a.precio_unitario, 0);
        totalGastoAnual += gastoCategoria;

        const categoria = await prisma.ticCategory.create({
          data: {
            inventarioId: inventario.id,
            nombre: catNombre,
            orden: orden++,
            gastoTotal: gastoCategoria,
          },
        });

        await prisma.ticArticle.createMany({
          data: arts.map(a => ({
            categoriaId: categoria.id,
            nombre: a.articulo_nombre.trim(),
            descripcion: a.articulo_descripcion || null,
            cantidad: a.cantidad,
            precioUnitario: a.precio_unitario,
            subtotal: a.cantidad * a.precio_unitario,
            proveedor: a.proveedor || null,
            fechaVencimiento: parseDate(a.fecha_vencimiento),
            notas: a.notas || null,
          })),
        });
      }

      // Actualizar gasto anual
      await prisma.ticInventario.update({
        where: { id: inventario.id },
        data: { gastoAnual: totalGastoAnual },
      });

      creados.push({
        nombre: inventario.nombre,
        cliente: nombreCliente,
        categorias: catMap.size,
        articulos: filas.length,
      });
    }

    return NextResponse.json({
      ok: true,
      inventarios_creados: creados.length,
      total_filas: rows.length,
      advertencias: errors,
      detalle: creados,
    });
  } catch (error: any) {
    console.error('Error importar inventario:', error);
    return NextResponse.json({ error: 'Error al procesar el archivo: ' + error.message }, { status: 500 });
  }
}
