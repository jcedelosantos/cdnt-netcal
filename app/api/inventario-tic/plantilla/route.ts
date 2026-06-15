export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import ExcelJS from 'exceljs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'RedCalc';
  wb.created = new Date();

  // Hoja de datos
  const ws = wb.addWorksheet('Inventario TIC', { views: [{ state: 'frozen', ySplit: 1 }] });

  ws.columns = [
    { header: 'cliente',                key: 'cliente',                width: 22 },
    { header: 'inventario_nombre',      key: 'inventario_nombre',      width: 28 },
    { header: 'inventario_fecha',       key: 'inventario_fecha',       width: 16 },
    { header: 'inventario_estado',      key: 'inventario_estado',      width: 16 },
    { header: 'inventario_descripcion', key: 'inventario_descripcion', width: 30 },
    { header: 'categoria',              key: 'categoria',              width: 20 },
    { header: 'articulo_nombre',        key: 'articulo_nombre',        width: 28 },
    { header: 'articulo_descripcion',   key: 'articulo_descripcion',   width: 30 },
    { header: 'cantidad',               key: 'cantidad',               width: 12 },
    { header: 'precio_unitario',        key: 'precio_unitario',        width: 16 },
    { header: 'proveedor',              key: 'proveedor',              width: 20 },
    { header: 'fecha_vencimiento',      key: 'fecha_vencimiento',      width: 18 },
    { header: 'notas',                  key: 'notas',                  width: 30 },
  ];

  // Encabezado
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1564AF' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF0D4A8A' } } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Filas de ejemplo
  const ejemplos = [
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Servidores','Dell PowerEdge R740','Servidor principal',2,4500,'Dell Technologies','2026-12-31','Garantía extendida 3 años'],
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Servidores','HP ProLiant DL380','Servidor secundario respaldo',1,3200,'HP Inc','2025-06-30',''],
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Licencias Software','Microsoft Office 365','Suite ofimática',25,120,'Microsoft','2025-12-31','Suscripción anual'],
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Licencias Software','Adobe Creative Cloud','Diseño y multimedia',5,600,'Adobe','2025-12-31',''],
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Red y Conectividad','Switch Cisco Catalyst 2960','Switch 24 puertos',3,850,'Cisco Systems','',''],
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Red y Conectividad','Router Mikrotik CCR2004','Router principal',1,1200,'Mikrotik','','Firmware v7.x'],
    ['Empresa ABC','Inventario TIC 2024','2024-01-15','completado','Inventario anual de activos','Equipos de Usuario','Laptop Dell Latitude 5530','Personal administrativo',10,1100,'Dell Technologies','2027-01-01','Garantía 3 años'],
    ['Reverse SA','Inventario TIC Q1 2025','2025-03-01','borrador','Primer trimestre','Telecomunicaciones','Teléfono IP Grandstream GXP2170','Recepción',4,95,'Grandstream','',''],
    ['Reverse SA','Inventario TIC Q1 2025','2025-03-01','borrador','Primer trimestre','Telecomunicaciones','Central IP FreePBX','Central telefónica',1,350,'FreePBX','','En la nube'],
    ['Reverse SA','Inventario TIC Q1 2025','2025-03-01','borrador','Primer trimestre','Seguridad','Cámara IP Hikvision DS-2CD2T47G2','Seguridad exterior',6,180,'Hikvision','2027-01-01',''],
  ];

  ejemplos.forEach((row, i) => {
    const r = ws.addRow(row);
    r.height = 20;
    const bg = i % 2 === 0 ? 'FFF0F4FF' : 'FFFFFFFF';
    r.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD9DFE8' } },
        right: { style: 'thin', color: { argb: 'FFD9DFE8' } },
      };
    });
    r.getCell('cantidad').numFmt = '#,##0.##';
    r.getCell('precio_unitario').numFmt = '$#,##0.00';
  });

  // Validación columna estado
  for (let i = 2; i <= 500; i++) {
    ws.getCell('D' + i).dataValidation = {
      type: 'list', allowBlank: true,
      formulae: ['"borrador,completado,archivado"'],
      showErrorMessage: true, errorTitle: 'Estado inválido',
      error: 'Use: borrador, completado o archivado',
    };
  }

  // Hoja instrucciones
  const wi = wb.addWorksheet('Instrucciones');
  const instrucciones = [
    ['INSTRUCCIONES DE USO'],
    [''],
    ['ESTRUCTURA DEL ARCHIVO'],
    ['Cada fila representa un artículo. Para un inventario con múltiples categorías,'],
    ['repita cliente, inventario_nombre y inventario_fecha en cada fila del mismo inventario.'],
    [''],
    ['COLUMNAS OBLIGATORIAS (*)'],
    ['cliente *              → Nombre del cliente. Si no existe, se crea automáticamente.'],
    ['inventario_nombre *    → Nombre del inventario. Mismo valor agrupa artículos.'],
    ['categoria *            → Nombre de la categoría (ej: Servidores, Licencias, Red).'],
    ['articulo_nombre *      → Nombre del artículo o equipo.'],
    ['cantidad *             → Cantidad (número, acepta decimales).'],
    ['precio_unitario *      → Precio unitario en USD.'],
    [''],
    ['COLUMNAS OPCIONALES'],
    ['inventario_fecha        → Fecha del inventario (YYYY-MM-DD). Ej: 2024-01-15'],
    ['inventario_estado       → borrador | completado | archivado (defecto: borrador)'],
    ['inventario_descripcion  → Descripción general del inventario.'],
    ['articulo_descripcion    → Descripción del artículo.'],
    ['proveedor               → Nombre del proveedor o marca.'],
    ['fecha_vencimiento       → Fecha de vencimiento o garantía (YYYY-MM-DD).'],
    ['notas                   → Notas adicionales.'],
    [''],
    ['AGRUPACIÓN'],
    ['El sistema agrupa filas por: cliente + inventario_nombre + inventario_fecha'],
    ['Artículos con el mismo valor en "categoria" quedan en la misma categoría.'],
    [''],
    ['FORMATOS DE FECHA'],
    ['Use el formato YYYY-MM-DD → 2024-01-15'],
  ];

  instrucciones.forEach((row, i) => {
    const r = wi.addRow(row);
    if (i === 0) {
      r.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1564AF' } };
      r.height = 26;
    } else if ([2, 6, 13, 20, 23, 27].includes(i)) {
      r.getCell(1).font = { bold: true, size: 11 };
    } else {
      r.getCell(1).font = { size: 10, color: { argb: 'FF444444' } };
    }
  });
  wi.getColumn(1).width = 80;

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_inventario_tic.xlsx"',
    },
  });
}
