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
  const marginX = 40;
  const primary: [number, number, number] = [37, 99, 235]; // blue-600

  // Encabezado (membrete de empresa si está configurado, si no marca RedCalc)
  const emp = data.empresa;
  const tieneEmpresa = !!(emp?.nombre);
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, 70, 'F');

  let textoX = marginX;
  if (emp?.logo) {
    try {
      doc.addImage(emp.logo, marginX, 14, 42, 42);
      textoX = marginX + 54;
    } catch { /* logo inválido: se ignora */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tieneEmpresa ? 18 : 22);
  doc.text(tieneEmpresa ? (emp!.nombre as string) : 'RedCalc', textoX, tieneEmpresa ? 32 : 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (tieneEmpresa) {
    const contacto: string[] = [];
    if (emp?.rnc) contacto.push(`RNC: ${emp.rnc}`);
    if (emp?.telefono) contacto.push(`Tel: ${emp.telefono}`);
    if (emp?.email) contacto.push(emp.email);
    if (contacto.length) doc.text(contacto.join('   |   '), textoX, 46);
    if (emp?.direccion) doc.text(emp.direccion, textoX, 58);
  } else {
    doc.text('Cálculo de Materiales para Redes y CCTV', textoX, 54);
  }
  const tituloDoc = data.showPrices ? 'COTIZACIÓN' : 'LISTADO DE MATERIALES';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(tituloDoc, pageW - marginX, 24, { align: 'right' });
  // Estado del proyecto (sello con recuadro de color)
  const estadoTxt = data.project.aprobado ? 'APROBADO' : 'PENDIENTE';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const badgeW = doc.getTextWidth(estadoTxt) + 16;
  const badgeX = pageW - marginX - badgeW;
  if (data.project.aprobado) doc.setFillColor(34, 197, 94); // green-500
  else doc.setFillColor(120, 130, 150); // gris
  doc.roundedRect(badgeX, 33, badgeW, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(estadoTxt, badgeX + 8, 44);

  // Datos del proyecto
  let y = 95;
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(data.project.nombre ?? 'Proyecto', marginX, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const meta: string[] = [];
  if (data.project.cliente) meta.push(`Cliente: ${data.project.cliente}`);
  if (data.project.ubicacion) meta.push(`Ubicación: ${data.project.ubicacion}`);
  meta.push(`Categoría: ${data.project.categoriaCable ?? 'Cat6'}`);
  meta.push(`Fecha: ${fmtFecha(data.project.fecha)}`);
  doc.text(meta.join('   |   '), marginX, y);
  y += 14;
  doc.text(
    `Puntos: ${data.resumen.totalPuntos}   |   Cajas de cable: ${data.resumen.totalCajas}   |   Cable: ${Math.round(
      data.resumen.totalCableMetros,
    )} m   |   Puntos PoE: ${data.resumen.puntosPoE}`,
    marginX,
    y,
  );
  y += 12;

  // Tabla por categoría
  const showP = data.showPrices;
  for (const cat of data.categorias) {
    const head = showP
      ? [['Material', 'Cant.', 'Unidad', 'Precio Unit.', 'Subtotal']]
      : [['Material', 'Cantidad', 'Unidad']];
    const bodyRows = cat.items.map((m) =>
      showP
        ? [m.nombre, String(m.cantidad), m.unidad, fmtMoney(m.precioUnit), fmtMoney(m.subtotal)]
        : [m.nombre, String(m.cantidad), m.unidad],
    );

    // Título de la categoría (salta de página si no cabe)
    const pageH = doc.internal.pageSize.getHeight();
    if (y + 60 > pageH) {
      doc.addPage();
      y = 50;
    }
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(cat.nombre, marginX, y);

    autoTable(doc, {
      startY: y + 6,
      head,
      body: bodyRows,
      margin: { left: marginX, right: marginX },
      headStyles: { fillColor: primary, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      styles: { cellPadding: 4 },
      columnStyles: showP
        ? { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
        : { 1: { halign: 'center' }, 2: { halign: 'center' } },
    });
    // @ts-ignore - lastAutoTable lo agrega el plugin
    y = (doc as any).lastAutoTable?.finalY ?? y + 30;
  }

  // Cotización
  if (showP && data.totales) {
    const t = data.totales;
    const rows: [string, string][] = [['Subtotal materiales', fmtMoney(t.subtotalMateriales)]];
    if (t.margen > 0) rows.push([`Margen de ganancia (${t.margenPct}%)`, fmtMoney(t.margen)]);
    if (t.costoManoObra > 0) rows.push(['Mano de obra', fmtMoney(t.costoManoObra)]);
    if (t.costoTransporte > 0) rows.push(['Transporte', fmtMoney(t.costoTransporte)]);
    if (t.costoConfiguracion > 0) rows.push(['Configuración', fmtMoney(t.costoConfiguracion)]);
    if (t.costoCertificacion > 0) rows.push(['Certificación', fmtMoney(t.costoCertificacion)]);
    rows.push(['Subtotal general', fmtMoney(t.subtotalGeneral)]);
    rows.push([`ITBIS (${t.itbisPct}%)`, fmtMoney(t.itbisValor)]);
    rows.push(['TOTAL GENERAL', fmtMoney(t.total)]);

    autoTable(doc, {
      startY: y + 10,
      body: rows,
      margin: { left: pageW / 2, right: marginX },
      theme: 'plain',
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
      didParseCell: (hook) => {
        if (hook.row.index === rows.length - 1) {
          hook.cell.styles.fontStyle = 'bold';
          hook.cell.styles.fontSize = 12;
          hook.cell.styles.textColor = primary;
        }
      },
    });
  }

  // Pie de página
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado con RedCalc', marginX, h - 20);
    doc.text(`Página ${i} de ${pages}`, pageW - marginX, h - 20, { align: 'right' });
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
    r1.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
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
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
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
        r.font = { bold: true, size: 12, color: { argb: 'FF2563EB' } };
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
  const BLUE = '2563EB';
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
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: showP ? 'COTIZACIÓN' : 'LISTADO DE MATERIALES', bold: true, size: 24 })],
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
