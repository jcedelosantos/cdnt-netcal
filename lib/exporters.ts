/**
 * Exportadores de reportes/cotizaciones de RedCalc.
 * Generan PDF, Excel (.xlsx) y Word (.docx) en el navegador.
 * El CSV se mantiene en el componente por simplicidad.
 */
import { saveAs } from 'file-saver';

export interface ExportMaterial {
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnit: number;
  subtotal: number;
}

export interface ExportCategoria {
  nombre: string;
  items: ExportMaterial[];
}

export interface ExportTotales {
  subtotalMateriales: number;
  margen: number;
  margenPct: number;
  costoManoObra: number;
  costoTransporte: number;
  costoConfiguracion: number;
  costoCertificacion: number;
  subtotalGeneral: number;
  itbisPct: number;
  itbisValor: number;
  total: number;
}

export interface ExportEmpresa {
  nombre?: string;
  rnc?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  logo?: string; // data URL
  banco?: string;
  cuenta?: string;
  tipoCuenta?: string;
  nombreCuenta?: string;
}

export interface ExportData {
  empresa?: ExportEmpresa;
  moneda?: string; // 'DOP' | 'USD'
  project: {
    nombre: string;
    cliente?: string;
    ubicacion?: string;
    categoriaCable?: string;
    fecha?: string;
    notas?: string;
    aprobado?: boolean;
    numeroCotizacion?: string;
    numeroFactura?: string;
  };
  resumen: {
    totalPuntos: number;
    totalCajas: number;
    totalCableMetros: number;
    puntosPoE: number;
  };
  categorias: ExportCategoria[];
  showPrices: boolean;
  totales: ExportTotales | null;
}

const simboloMoneda = (moneda?: string) => (moneda === 'USD' ? 'US$' : 'RD$');

const fmtMoneyBase = (n: number, simbolo = 'RD$') =>
  simbolo + ' ' + (n ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtFecha = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
};

const safeName = (nombre: string, ext: string) =>
  `${(nombre ?? 'proyecto').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'proyecto'}.${ext}`;

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */
export async function exportarPDF(data: ExportData) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const sim = simboloMoneda(data.moneda);
  const fmtMoney = (n: number) => fmtMoneyBase(n, sim);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const mX = 40; // margin horizontal
  const brandBlue: [number, number, number] = [21, 100, 175];  // azul corporativo
  const limeGreen: [number, number, number] = [100, 175, 0];   // Total General
  const sepColor: [number, number, number] = [210, 208, 220];

  const emp = data.empresa;
  const showP = data.showPrices;

  // Helper: extrae dimensiones de un PNG desde su data URL (bytes 16-23 del header)
  const getPngDims = (dataUrl: string): { w: number; h: number } => {
    try {
      const b64 = dataUrl.split(',')[1] ?? '';
      const raw = atob(b64.slice(0, 40)); // solo necesitamos los primeros 24 bytes
      const dv = new DataView(new ArrayBuffer(24));
      for (let i = 0; i < Math.min(24, raw.length); i++) dv.setUint8(i, raw.charCodeAt(i));
      return { w: dv.getUint32(16), h: dv.getUint32(20) };
    } catch { return { w: 1, h: 1 }; }
  };

  // ── LOGO (esquina superior izquierda) ────────────────────────────────
  let y = 36;
  const logoMaxH = 72;
  let logoRight = mX;
  if (emp?.logo) {
    try {
      const fmt = emp.logo.includes('image/png') ? 'PNG' : 'JPEG';
      const dims = fmt === 'PNG' ? getPngDims(emp.logo) : { w: 1, h: 1 };
      const ratio = dims.w > 0 && dims.h > 0 ? dims.w / dims.h : 1;
      const logoH = logoMaxH;
      const logoW = Math.round(logoH * ratio);
      doc.addImage(emp.logo, fmt, mX, y, logoW, logoH);
      logoRight = mX + logoW + 12;
    } catch {}
  }

  // ── Título grande (derecha): "Factura" si está facturado, si no "Cotización"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(25, 25, 25);
  doc.text(data.project.numeroFactura ? 'Factura' : 'Cotización', pageW - mX, y + 28, { align: 'right' });

  // ── Info de empresa (columna derecha, debajo del título) ─────────────
  let ry = y + 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(25, 25, 25);
  if (emp?.nombre) {
    doc.text(emp.nombre, pageW - mX, ry, { align: 'right' });
    ry += 14;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  if (emp?.rnc) { doc.text(`RNC:${emp.rnc}`, pageW - mX, ry, { align: 'right' }); ry += 12; }
  if (emp?.email) { doc.text(emp.email, pageW - mX, ry, { align: 'right' }); ry += 12; }
  if (emp?.telefono) { doc.text(emp.telefono, pageW - mX, ry, { align: 'right' }); ry += 12; }
  if (emp?.direccion) { doc.text(emp.direccion, pageW - mX, ry, { align: 'right' }); ry += 12; }
  // Info bancaria (si está configurada)
  if (emp?.nombreCuenta && emp?.cuenta) {
    ry += 2;
    const cuentaLabel = `*Nombre*: ${emp.nombreCuenta}   *Cta*:${emp.cuenta}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(cuentaLabel, pageW - mX, ry, { align: 'right' }); ry += 12;
    if (emp?.tipoCuenta || emp?.banco) {
      const bancoLabel = [emp?.tipoCuenta && `*Tipo*: ${emp.tipoCuenta}`, emp?.banco && `*Banco*:${emp.banco}`].filter(Boolean).join('   ');
      doc.text(bancoLabel, pageW - mX, ry, { align: 'right' }); ry += 12;
    }
  }

  y = Math.max(y + logoMaxH + 10, ry) + 8;

  // ── LÍNEA SEPARADORA ────────────────────────────────────────────────
  doc.setDrawColor(...sepColor);
  doc.setLineWidth(0.6);
  doc.line(mX, y, pageW - mX, y);
  y += 16;

  // ── BLOQUE CLIENTE (izq) + NÚMERO COTIZACIÓN (der) ──────────────────
  const colMid = pageW / 2 + 10;
  const clientStartY = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(25, 25, 25);
  doc.text('Para', mX, y);
  y += 14;

  if (data.project.cliente) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.project.cliente, mX, y);
    y += 14;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  if (data.project.ubicacion) { doc.text(data.project.ubicacion, mX, y); y += 12; }
  if (data.project.categoriaCable) { doc.text(`Categoría cable: ${data.project.categoriaCable}`, mX, y); y += 12; }

  // Número de cotización / factura + fecha (columna derecha)
  const quoteDate = data.project.fecha ? new Date(data.project.fecha) : new Date();
  const yy = quoteDate.getFullYear();
  const mm = String(quoteDate.getMonth() + 1).padStart(2, '0');
  const dd = String(quoteDate.getDate()).padStart(2, '0');
  const cotNum = data.project.numeroCotizacion || `COT-${yy}${mm}${dd}`;
  const facNum = data.project.numeroFactura;
  const fechaStr = `${dd}/${mm}/${yy}`;

  let rowY = clientStartY;
  const labelVal = (label: string, val: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(25, 25, 25);
    doc.text(label, colMid, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(val, pageW - mX, rowY, { align: 'right' });
    rowY += 16;
  };
  labelVal('Cotización #', cotNum);
  if (facNum) labelVal('Factura #', facNum);
  labelVal('Fecha', fechaStr);

  y = Math.max(y, rowY) + 8;

  // ── LÍNEA SEPARADORA ────────────────────────────────────────────────
  doc.setDrawColor(...sepColor);
  doc.line(mX, y, pageW - mX, y);
  y += 8;

  // ── TABLA ÚNICA de materiales ────────────────────────────────────────
  const head = showP
    ? [['Servicio', 'Cantidad', 'Precio', 'Importe']]
    : [['Servicio', 'Cantidad', 'Unidad']];

  const bodyRows: any[] = [];
  for (const cat of data.categorias) {
    // Fila separadora de categoría (sutil)
    const catSpan = showP ? 4 : 3;
    bodyRows.push([{
      content: cat.nombre,
      colSpan: catSpan,
      styles: {
        fontStyle: 'bold' as const,
        fillColor: [235, 244, 255] as [number, number, number],
        textColor: brandBlue,
        fontSize: 8.5,
        cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
      },
    }]);
    for (const m of cat.items) {
      bodyRows.push(showP
        ? [m.nombre, String(m.cantidad), fmtMoney(m.precioUnit), fmtMoney(m.subtotal)]
        : [m.nombre, String(m.cantidad), m.unidad],
      );
    }
  }

  autoTable(doc, {
    startY: y,
    head,
    body: bodyRows,
    margin: { left: mX, right: mX },
    headStyles: {
      fillColor: brandBlue,
      textColor: [255, 255, 255] as [number, number, number],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 9, cellPadding: { top: 6, bottom: 6, left: 8, right: 8 } },
    alternateRowStyles: { fillColor: [248, 251, 255] as [number, number, number] },
    columnStyles: showP
      ? {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 60 },
          2: { halign: 'right', cellWidth: 90 },
          3: { halign: 'right', cellWidth: 90 },
        }
      : {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 70 },
          2: { halign: 'center', cellWidth: 70 },
        },
  });

  y = (doc as any).lastAutoTable?.finalY ?? y + 30;

  // ── TOTALES (derecha) ────────────────────────────────────────────────
  if (showP && data.totales) {
    const t = data.totales;
    const rows: Array<[string, string, boolean?]> = [
      ['Subtotal', fmtMoney(t.subtotalMateriales)],
    ];
    if (t.margen > 0) rows.push([`Margen de ganancia (${t.margenPct}%)`, fmtMoney(t.margen)]);
    if (t.costoManoObra > 0) rows.push(['Mano de obra', fmtMoney(t.costoManoObra)]);
    if (t.costoTransporte > 0) rows.push(['Transporte', fmtMoney(t.costoTransporte)]);
    if (t.costoConfiguracion > 0) rows.push(['Configuración', fmtMoney(t.costoConfiguracion)]);
    if (t.costoCertificacion > 0) rows.push(['Certificación', fmtMoney(t.costoCertificacion)]);
    rows.push([`ITBIS (${t.itbisPct}%)`, fmtMoney(t.itbisValor)]);
    rows.push(['Total General', fmtMoney(t.total), true]);

    autoTable(doc, {
      startY: y + 12,
      body: rows.map(([k, v]) => [k, v]),
      margin: { left: pageW * 0.52, right: mX },
      theme: 'plain',
      styles: { cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: {}, 1: { halign: 'right' } },
      didParseCell: (hook) => {
        const rowMeta = rows[hook.row.index];
        if (rowMeta?.[2]) {
          hook.cell.styles.fontStyle = 'bold';
          hook.cell.styles.fontSize = 12;
          hook.cell.styles.textColor = limeGreen;
          hook.cell.styles.fillColor = [248, 248, 248];
        }
      },
    });
  }

  // ── NOTAS ────────────────────────────────────────────────────────────
  if (data.project.notas) {
    y = (doc as any).lastAutoTable?.finalY ?? y;
    y += 20;
    const pageH = doc.internal.pageSize.getHeight();
    if (y + 30 > pageH - 40) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text('Notas:', mX, y);
    doc.setFont('helvetica', 'normal');
    y += 12;
    const lines = doc.splitTextToSize(data.project.notas, pageW - mX * 2);
    doc.text(lines, mX, y);
  }

  // ── PIE DE PÁGINA ────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text('Generado con RedCalc', mX, h - 20);
    doc.text(`Página ${i} de ${pages}`, pageW - mX, h - 20, { align: 'right' });
  }

  doc.save(safeName(data.project.nombre, 'pdf'));
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */
export async function exportarExcel(data: ExportData) {
  const ExcelJS = (await import('exceljs')).default;
  const sim = simboloMoneda(data.moneda);
  const numFmtMoneda = `"${sim}" #,##0.00`;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RedCalc';
  wb.created = new Date();
  const ws = wb.addWorksheet('Materiales');
  const emp = data.empresa;

  const showP = data.showPrices;
  const cols = showP
    ? ['Categoría', 'Material', 'Cantidad', 'Unidad', 'Precio Unit.', 'Subtotal']
    : ['Categoría', 'Material', 'Cantidad', 'Unidad'];
  const nCols = cols.length;
  // Anchos de columna
  cols.forEach((_, i) => { ws.getColumn(i + 1).width = i === 0 ? 24 : i === 1 ? 38 : 16; });

  // Membrete de empresa (si está configurado)
  if (emp?.nombre) {
    const r1 = ws.addRow([emp.nombre]);
    ws.mergeCells(r1.number, 1, r1.number, nCols);
    r1.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1564AF' } };
    const contacto: string[] = [];
    if (emp?.rnc) contacto.push(`RNC: ${emp.rnc}`);
    if (emp?.telefono) contacto.push(`Tel: ${emp.telefono}`);
    if (emp?.email) contacto.push(emp.email);
    if (emp?.direccion) contacto.push(emp.direccion);
    if (contacto.length) {
      const r2 = ws.addRow([contacto.join('   |   ')]);
      ws.mergeCells(r2.number, 1, r2.number, nCols);
      r2.getCell(1).font = { size: 10, color: { argb: 'FF666666' } };
    }
    ws.addRow([]);
  }

  // Encabezado de la tabla
  const headerRow = ws.addRow(cols);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1564AF' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  ws.views = [{ state: 'frozen', ySplit: headerRow.number }];

  for (const cat of data.categorias) {
    for (const m of cat.items) {
      const row = showP
        ? [cat.nombre, m.nombre, m.cantidad, m.unidad, m.precioUnit, m.subtotal]
        : [cat.nombre, m.nombre, m.cantidad, m.unidad];
      const r = ws.addRow(row);
      if (showP) {
        r.getCell(5).numFmt = numFmtMoneda;
        r.getCell(6).numFmt = numFmtMoneda;
      }
    }
  }

  // Hoja de cotización
  if (showP && data.totales) {
    const t = data.totales;
    const cot = wb.addWorksheet('Cotización');
    cot.columns = [
      { header: 'Concepto', key: 'k', width: 32 },
      { header: 'Monto', key: 'v', width: 20 },
    ];
    cot.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1564AF' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });
    const filas: [string, number][] = [['Subtotal materiales', t.subtotalMateriales]];
    if (t.margen > 0) filas.push([`Margen (${t.margenPct}%)`, t.margen]);
    if (t.costoManoObra > 0) filas.push(['Mano de obra', t.costoManoObra]);
    if (t.costoTransporte > 0) filas.push(['Transporte', t.costoTransporte]);
    if (t.costoConfiguracion > 0) filas.push(['Configuración', t.costoConfiguracion]);
    if (t.costoCertificacion > 0) filas.push(['Certificación', t.costoCertificacion]);
    filas.push(['Subtotal general', t.subtotalGeneral]);
    filas.push([`ITBIS (${t.itbisPct}%)`, t.itbisValor]);
    filas.push(['TOTAL GENERAL', t.total]);
    filas.forEach(([k, v], i) => {
      const r = cot.addRow([k, v]);
      r.getCell(2).numFmt = numFmtMoneda;
      if (i === filas.length - 1) {
        r.font = { bold: true, size: 12, color: { argb: 'FF1564AF' } };
      }
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), safeName(data.project.nombre, 'xlsx'));
}

/* ------------------------------------------------------------------ */
/* Word                                                                */
/* ------------------------------------------------------------------ */
export async function exportarWord(data: ExportData) {
  const docx = await import('docx');
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun,
  } = docx;

  const showP = data.showPrices;
  const BLUE = '1564AF';
  const emp = data.empresa;
  const sim = simboloMoneda(data.moneda);
  const fmtMoney = (n: number) => fmtMoneyBase(n, sim);

  const cellText = (text: string, opts: { bold?: boolean; color?: string; align?: any } = {}) =>
    new Paragraph({
      alignment: opts.align,
      children: [new TextRun({ text, bold: opts.bold, color: opts.color })],
    });

  const headerCell = (text: string, align?: any) =>
    new TableCell({
      shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
      children: [cellText(text, { bold: true, color: 'FFFFFF', align })],
    });

  const dataCell = (text: string, align?: any) =>
    new TableCell({ children: [cellText(text, { align })] });

  const children: any[] = [];

  // Encabezado: membrete de empresa si está configurado, si no marca RedCalc
  const tieneEmpresa = !!(emp?.nombre);
  if (emp?.logo) {
    try {
      const m = /^data:(image\/(png|jpeg|jpg|gif));base64,(.+)$/i.exec(emp.logo);
      if (m) {
        const bytes = Uint8Array.from(atob(m[3]), (c) => c.charCodeAt(0));
        const tipo = m[2].toLowerCase() === 'jpg' ? 'jpeg' : m[2].toLowerCase();
        children.push(new Paragraph({
          children: [new ImageRun({ data: bytes, transformation: { width: 90, height: 90 }, type: tipo as any })],
        }));
      }
    } catch { /* logo inválido: se ignora */ }
  }
  if (tieneEmpresa) {
    children.push(new Paragraph({ children: [new TextRun({ text: emp!.nombre as string, bold: true, size: 36, color: BLUE })] }));
    const contacto: string[] = [];
    if (emp?.rnc) contacto.push(`RNC: ${emp.rnc}`);
    if (emp?.telefono) contacto.push(`Tel: ${emp.telefono}`);
    if (emp?.email) contacto.push(emp.email as string);
    if (contacto.length) children.push(new Paragraph({ children: [new TextRun({ text: contacto.join('  |  '), size: 16, color: '666666' })] }));
    if (emp?.direccion) children.push(new Paragraph({ children: [new TextRun({ text: emp.direccion, size: 16, color: '666666' })] }));
  } else {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'RedCalc', bold: true, size: 40, color: BLUE })] }),
      new Paragraph({ children: [new TextRun({ text: 'Cálculo de Materiales para Redes y CCTV', size: 18, color: '666666' })] }),
    );
  }
  const tituloDoc = !showP ? 'LISTADO DE MATERIALES' : (data.project.numeroFactura ? 'FACTURA' : 'COTIZACIÓN');
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: tituloDoc, bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({
        text: data.project.aprobado ? 'Estado: APROBADO' : 'Estado: PENDIENTE',
        bold: true, size: 18, color: data.project.aprobado ? '16A34A' : '777777',
      })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: data.project.nombre ?? 'Proyecto' })] }),
  );
  const metaParts: string[] = [];
  if (data.project.numeroCotizacion) metaParts.push(`Cotización #: ${data.project.numeroCotizacion}`);
  if (data.project.numeroFactura) metaParts.push(`Factura #: ${data.project.numeroFactura}`);
  if (data.project.cliente) metaParts.push(`Cliente: ${data.project.cliente}`);
  if (data.project.ubicacion) metaParts.push(`Ubicación: ${data.project.ubicacion}`);
  metaParts.push(`Categoría: ${data.project.categoriaCable ?? 'Cat6'}`);
  metaParts.push(`Fecha: ${fmtFecha(data.project.fecha)}`);
  children.push(new Paragraph({ children: [new TextRun({ text: metaParts.join('  |  '), size: 18, color: '555555' })] }));
  children.push(new Paragraph({
    children: [new TextRun({
      text: `Puntos: ${data.resumen.totalPuntos}  |  Cajas: ${data.resumen.totalCajas}  |  Cable: ${Math.round(data.resumen.totalCableMetros)} m  |  Puntos PoE: ${data.resumen.puntosPoE}`,
      size: 18, color: '555555',
    })],
  }));
  children.push(new Paragraph({ text: '' }));

  // Tablas por categoría
  for (const cat of data.categorias) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: cat.nombre, color: BLUE })] }));
    const headRow = new TableRow({
      tableHeader: true,
      children: showP
        ? [headerCell('Material'), headerCell('Cant.', AlignmentType.CENTER), headerCell('Unidad', AlignmentType.CENTER), headerCell('Precio Unit.', AlignmentType.RIGHT), headerCell('Subtotal', AlignmentType.RIGHT)]
        : [headerCell('Material'), headerCell('Cantidad', AlignmentType.CENTER), headerCell('Unidad', AlignmentType.CENTER)],
    });
    const bodyRows = cat.items.map((m) =>
      new TableRow({
        children: showP
          ? [dataCell(m.nombre), dataCell(String(m.cantidad), AlignmentType.CENTER), dataCell(m.unidad, AlignmentType.CENTER), dataCell(fmtMoney(m.precioUnit), AlignmentType.RIGHT), dataCell(fmtMoney(m.subtotal), AlignmentType.RIGHT)]
          : [dataCell(m.nombre), dataCell(String(m.cantidad), AlignmentType.CENTER), dataCell(m.unidad, AlignmentType.CENTER)],
      }),
    );
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
      },
      rows: [headRow, ...bodyRows],
    }));
    children.push(new Paragraph({ text: '' }));
  }

  // Cotización
  if (showP && data.totales) {
    const t = data.totales;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Resumen de Cotización', color: BLUE })] }));
    const filas: [string, string, boolean][] = [['Subtotal materiales', fmtMoney(t.subtotalMateriales), false]];
    if (t.margen > 0) filas.push([`Margen (${t.margenPct}%)`, fmtMoney(t.margen), false]);
    if (t.costoManoObra > 0) filas.push(['Mano de obra', fmtMoney(t.costoManoObra), false]);
    if (t.costoTransporte > 0) filas.push(['Transporte', fmtMoney(t.costoTransporte), false]);
    if (t.costoConfiguracion > 0) filas.push(['Configuración', fmtMoney(t.costoConfiguracion), false]);
    if (t.costoCertificacion > 0) filas.push(['Certificación', fmtMoney(t.costoCertificacion), false]);
    filas.push(['Subtotal general', fmtMoney(t.subtotalGeneral), false]);
    filas.push([`ITBIS (${t.itbisPct}%)`, fmtMoney(t.itbisValor), false]);
    filas.push(['TOTAL GENERAL', fmtMoney(t.total), true]);
    children.push(new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.RIGHT,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: filas.map(([k, v, bold]) => new TableRow({
        children: [
          new TableCell({ children: [cellText(k, { bold })] }),
          new TableCell({ children: [cellText(v, { bold, color: bold ? BLUE : undefined, align: AlignmentType.RIGHT })] }),
        ],
      })),
    }));
  }

  if (data.project.notas) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Notas: ', bold: true }), new TextRun({ text: data.project.notas })] }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, safeName(data.project.nombre, 'docx'));
}
