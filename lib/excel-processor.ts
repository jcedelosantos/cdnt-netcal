import { Workbook } from 'exceljs';
import { prisma } from './prisma';

interface ProcessedArticle {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descripcion?: string;
  proveedor?: string;
  fechaVencimiento?: string;
}

interface ProcessResult {
  success: boolean;
  categoriesCreated: number;
  articlesCreated: number;
  errors: Array<{ sheet: string; row: number; error: string }>;
  message: string;
}

const CATEGORY_MAPPINGS: Record<string, string> = {
  'equipos': 'Equipos',
  'equipment': 'Equipos',
  'licencias': 'Licencias',
  'licenses': 'Licencias',
  'consumos': 'Consumos',
  'consumptions': 'Consumos',
  'soportes': 'Soportes',
  'supports': 'Soportes',
  'proyectos': 'Proyectos',
  'projects': 'Proyectos',
};

const COLUMN_MAPPINGS: Record<string, string[]> = {
  nombre: ['nombre', 'name', 'articulo', 'article', 'descripcion'],
  cantidad: ['cantidad', 'quantity', 'cant', 'qty'],
  precioUnitario: ['precio', 'price', 'precio unitario', 'unit price', 'costo'],
  descripcion: ['descripcion', 'description', 'detalles', 'details'],
  proveedor: ['proveedor', 'provider', 'supplier'],
  fechaVencimiento: ['vencimiento', 'expiration', 'fecha vencimiento', 'expiry date'],
};

export async function processExcelFile(
  buffer: Buffer,
  inventarioId: string
): Promise<ProcessResult> {
  const errors: ProcessResult['errors'] = [];
  let categoriesCreated = 0;
  let articlesCreated = 0;

  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);

    // Process each sheet as a category
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name.toLowerCase().trim();

      // Skip hidden sheets and metadata sheets
      if (sheetName.startsWith('_') || sheetName === 'metadata') continue;

      // Map sheet name to category
      const categoryName = CATEGORY_MAPPINGS[sheetName] || worksheet.name;

      // Get or create category
      const categoria = await prisma.ticCategory.upsert({
        where: {
          id: `${inventarioId}-${categoryName}`, // Temporary unique key, will be overridden
        },
        update: {},
        create: {
          inventarioId,
          nombre: categoryName,
          orden: Object.keys(CATEGORY_MAPPINGS).indexOf(sheetName),
        },
      });

      // First, get or create by name+inventarioId combination
      let category = await prisma.ticCategory.findFirst({
        where: {
          inventarioId,
          nombre: categoryName,
        },
      });

      if (!category) {
        category = await prisma.ticCategory.create({
          data: {
            inventarioId,
            nombre: categoryName,
            orden: 0,
          },
        });
        categoriesCreated++;
      }

      // Process rows
      const headers = getHeaders(worksheet);

      let rowNum = 2; // Start from row 2 (after headers)
      for (const row of worksheet.getRows(2, worksheet.rowCount - 1) || []) {
        try {
          const article = parseRow(row, headers);

          if (!article.nombre) {
            errors.push({
              sheet: worksheet.name,
              row: rowNum,
              error: 'Nombre es requerido',
            });
            rowNum++;
            continue;
          }

          // Calculate subtotal
          const cantidad = parseFloat(article.cantidad.toString()) || 1;
          const precio = parseFloat(article.precioUnitario.toString()) || 0;
          const subtotal = cantidad * precio;

          // Create article
          await prisma.ticArticle.create({
            data: {
              categoriaId: category.id,
              nombre: article.nombre,
              cantidad,
              precioUnitario: precio,
              subtotal,
              descripcion: article.descripcion,
              proveedor: article.proveedor,
              fechaVencimiento: article.fechaVencimiento
                ? new Date(article.fechaVencimiento)
                : null,
            },
          });

          articlesCreated++;
        } catch (e: any) {
          errors.push({
            sheet: worksheet.name,
            row: rowNum,
            error: e.message || 'Error al procesar fila',
          });
        }
        rowNum++;
      }

      // Update category totals
      if (category) {
        await updateCategoryTotal(category.id);
      }
    }

    // Update inventory total
    await updateInventoryTotal(inventarioId);

    return {
      success: errors.length === 0,
      categoriesCreated,
      articlesCreated,
      errors: errors.slice(0, 10), // Limit errors returned
      message: `Se crearon ${categoriesCreated} categorías y ${articlesCreated} artículos${
        errors.length > 0 ? ` con ${errors.length} errores` : ''
      }`,
    };
  } catch (e: any) {
    return {
      success: false,
      categoriesCreated,
      articlesCreated,
      errors: [{ sheet: 'General', row: 0, error: e.message }],
      message: 'Error al procesar archivo Excel',
    };
  }
}

function getHeaders(worksheet: any): Record<string, number> {
  const headers: Record<string, number> = {};
  const headerRow = worksheet.getRow(1);

  headerRow.eachCell((cell: any, colNum: number) => {
    if (!cell.value) return;

    const columnName = cell.value.toString().toLowerCase().trim();

    // Match column
    for (const [key, aliases] of Object.entries(COLUMN_MAPPINGS)) {
      if (aliases.some((alias) => columnName.includes(alias))) {
        headers[key] = colNum;
        break;
      }
    }
  });

  return headers;
}

function parseRow(row: any, headers: Record<string, number>): ProcessedArticle {
  const article: ProcessedArticle = {
    nombre: '',
    cantidad: 1,
    precioUnitario: 0,
  };

  for (const [key, colNum] of Object.entries(headers)) {
    const value = row.getCell(colNum as unknown as number).value;

    if (!value) continue;

    switch (key) {
      case 'nombre':
        article.nombre = value.toString().trim();
        break;
      case 'cantidad':
        article.cantidad = parseFloat(value.toString()) || 1;
        break;
      case 'precioUnitario':
        article.precioUnitario = parseFloat(value.toString()) || 0;
        break;
      case 'descripcion':
        article.descripcion = value.toString().trim();
        break;
      case 'proveedor':
        article.proveedor = value.toString().trim();
        break;
      case 'fechaVencimiento':
        // Handle date in various formats
        const dateStr = value.toString().trim();
        if (dateStr) {
          try {
            article.fechaVencimiento = new Date(dateStr).toISOString();
          } catch (e) {
            // Skip invalid dates
          }
        }
        break;
    }
  }

  return article;
}

async function updateCategoryTotal(categoriaId: string) {
  const articulos = await prisma.ticArticle.findMany({
    where: { categoriaId },
  });

  const gastoTotal = articulos.reduce((sum, art) => sum + (art.subtotal || 0), 0);

  await prisma.ticCategory.update({
    where: { id: categoriaId },
    data: { gastoTotal },
  });
}

async function updateInventoryTotal(inventarioId: string) {
  const categorias = await prisma.ticCategory.findMany({
    where: { inventarioId },
  });

  const gastoAnual = categorias.reduce((sum, cat) => sum + (cat.gastoTotal || 0), 0);

  await prisma.ticInventario.update({
    where: { id: inventarioId },
    data: { gastoAnual },
  });
}
