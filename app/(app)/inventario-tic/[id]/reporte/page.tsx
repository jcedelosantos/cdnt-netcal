'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet, FileDown, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';

interface Articulo {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  proveedor?: string;
  responsable?: string;
  fechaVencimiento?: string;
  notas?: string;
}

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  gastoTotal: number;
  articulos: Articulo[];
}

interface Inventario {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha?: string;
  gastoAnual: number;
  estado: string;
  client: { nombre: string };
  categorias: Categoria[];
}

const COLORS = ['#1564AF', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function ReportePage() {
  const router = useRouter();
  const params = useParams();
  const inventarioId = params.id as string;

  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inventarioId) return;
    Promise.all([
      fetch(`/api/inventario-tic/${inventarioId}`).then(r => r.ok ? r.json() : null),
      fetch('/api/configuracion').then(r => r.ok ? r.json() : null),
    ]).then(([inv, cfg]) => {
      if (inv) setInventario(inv);
      if (cfg) setEmpresa(cfg);
    }).catch(() => toast.error('Error al cargar reporte')).finally(() => setLoading(false));
  }, [inventarioId]);

  const getExpiredArticulos = () => {
    if (!inventario) return [];
    const now = new Date();
    return inventario.categorias.flatMap(cat =>
      cat.articulos.filter(a => a.fechaVencimiento && new Date(a.fechaVencimiento) <= now)
        .map(a => ({ ...a, categoriaNombre: cat.nombre }))
    );
  };

  const getExpiringSoon = () => {
    if (!inventario) return [];
    const now = new Date();
    const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return inventario.categorias.flatMap(cat =>
      cat.articulos.filter(a => {
        if (!a.fechaVencimiento) return false;
        const v = new Date(a.fechaVencimiento);
        return v > now && v <= limit;
      }).map(a => ({ ...a, categoriaNombre: cat.nombre }))
    );
  };

  const exportPDF = async () => {
    if (!inventario) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const mX = 40;
      const brandBlue: [number, number, number] = [21, 100, 175];
      const sepColor: [number, number, number] = [210, 208, 220];

      const emp = empresa
        ? {
            nombre: empresa.empresaNombre,
            rnc: empresa.empresaRNC,
            telefono: empresa.empresaTelefono,
            direccion: empresa.empresaDireccion,
            email: empresa.empresaEmail,
            logo: empresa.empresaLogo,
          }
        : null;

      const fmtMoney = (n: number) => `$${(n ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const fmtFecha = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
      };

      // ── LOGO ──────────────────────────────────────────────────────────
      let y = 36;
      const logoMaxH = 72;
      if (emp?.logo) {
        try {
          const fmt = emp.logo.includes('image/png') ? 'PNG' : 'JPEG';
          // Detect image dimensions for PNG
          let ratio = 1;
          if (fmt === 'PNG') {
            try {
              const b64 = emp.logo.split(',')[1] ?? '';
              const raw = atob(b64.slice(0, 40));
              const dv = new DataView(new ArrayBuffer(24));
              for (let i = 0; i < Math.min(24, raw.length); i++) dv.setUint8(i, raw.charCodeAt(i));
              const w = dv.getUint32(16), h = dv.getUint32(20);
              if (w > 0 && h > 0) ratio = w / h;
            } catch { /* ignore */ }
          }
          const logoH = logoMaxH;
          const logoW = Math.round(logoH * ratio);
          doc.addImage(emp.logo, fmt, mX, y, logoW, logoH);
        } catch { /* logo inválido */ }
      }

      // ── TÍTULO + EMPRESA (derecha) ────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(25, 25, 25);
      doc.text('Inventario TIC', pageW - mX, y + 28, { align: 'right' });

      let ry = y + 48;
      if (emp?.nombre) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(25, 25, 25);
        doc.text(emp.nombre, pageW - mX, ry, { align: 'right' });
        ry += 14;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      if (emp?.rnc) { doc.text(`RNC: ${emp.rnc}`, pageW - mX, ry, { align: 'right' }); ry += 12; }
      if (emp?.email) { doc.text(emp.email, pageW - mX, ry, { align: 'right' }); ry += 12; }
      if (emp?.telefono) { doc.text(emp.telefono, pageW - mX, ry, { align: 'right' }); ry += 12; }
      if (emp?.direccion) { doc.text(emp.direccion, pageW - mX, ry, { align: 'right' }); ry += 12; }

      y = Math.max(y + logoMaxH + 10, ry) + 8;

      // ── SEPARADOR ─────────────────────────────────────────────────────
      doc.setDrawColor(...sepColor);
      doc.setLineWidth(0.6);
      doc.line(mX, y, pageW - mX, y);
      y += 16;

      // ── CLIENTE + DATOS DEL INVENTARIO ────────────────────────────────
      const colMid = pageW / 2 + 10;
      const blockStartY = y;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(25, 25, 25);
      doc.text('Cliente', mX, y);
      y += 14;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(inventario.client.nombre, mX, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.text(inventario.nombre, mX, y);
      y += 12;
      if (inventario.descripcion) {
        const lines = doc.splitTextToSize(inventario.descripcion, pageW / 2 - mX - 20);
        doc.text(lines, mX, y);
        y += lines.length * 12;
      }

      // Metadatos derecha
      let rowY = blockStartY;
      const labelVal = (label: string, val: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(25, 25, 25);
        doc.text(label, colMid, rowY);
        doc.setFont('helvetica', 'normal');
        doc.text(val, pageW - mX, rowY, { align: 'right' });
        rowY += 16;
      };
      const fechaInv = inventario.fecha ? fmtFecha(inventario.fecha) : fmtFecha(new Date().toISOString());
      labelVal('Fecha', fechaInv);
      labelVal('Estado', inventario.estado === 'completado' ? 'Completado' : inventario.estado === 'archivado' ? 'Archivado' : 'Borrador');
      labelVal('Categorías', inventario.categorias.length.toString());
      const totalArticulos = inventario.categorias.reduce((s, c) => s + c.articulos.length, 0);
      labelVal('Total artículos', totalArticulos.toString());
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...brandBlue);
      doc.text('Gasto Anual', colMid, rowY);
      doc.text(fmtMoney(inventario.gastoAnual), pageW - mX, rowY, { align: 'right' });

      y = Math.max(y, rowY + 20) + 8;

      // ── SEPARADOR ─────────────────────────────────────────────────────
      doc.setDrawColor(...sepColor);
      doc.line(mX, y, pageW - mX, y);
      y += 10;

      // ── TABLA RESUMEN POR CATEGORÍA ───────────────────────────────────
      const resumenRows = inventario.categorias.map(c => [
        c.nombre,
        c.articulos.length.toString(),
        fmtMoney(c.gastoTotal),
        inventario.gastoAnual > 0 ? `${((c.gastoTotal / inventario.gastoAnual) * 100).toFixed(1)}%` : '0%',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Categoría', 'Artículos', 'Gasto Total', '% del Total']],
        body: resumenRows,
        margin: { left: mX, right: mX },
        headStyles: {
          fillColor: brandBlue,
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: { fontSize: 9, cellPadding: { top: 6, bottom: 6, left: 8, right: 8 } },
        alternateRowStyles: { fillColor: [240, 246, 255] as [number, number, number] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 70 },
          2: { halign: 'right', cellWidth: 90 },
          3: { halign: 'right', cellWidth: 70 },
        },
      });

      y = (doc as any).lastAutoTable?.finalY ?? y + 20;
      y += 16;

      // ── DETALLE POR CATEGORÍA ─────────────────────────────────────────
      for (const cat of inventario.categorias) {
        if (cat.articulos.length === 0) continue;

        // Encabezado de categoría
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...brandBlue);
        const pageH = doc.internal.pageSize.getHeight();
        if (y + 50 > pageH - 50) { doc.addPage(); y = 50; }
        doc.text(cat.nombre, mX, y);
        if (cat.descripcion) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 100, 100);
          doc.text(` — ${cat.descripcion}`, mX + doc.getTextWidth(cat.nombre) + 4, y);
        }
        y += 6;

        const usaResponsable = cat.articulos.some(a => a.responsable);
        const col6Label = usaResponsable ? 'Responsable' : 'Vencimiento';

        const artRows = cat.articulos.map(a => [
          a.nombre + (a.descripcion ? `\n${a.descripcion}` : ''),
          a.cantidad.toString(),
          fmtMoney(a.precioUnitario),
          fmtMoney(a.subtotal),
          a.proveedor ?? '',
          usaResponsable
            ? (a.responsable ?? '')
            : (a.fechaVencimiento ? new Date(a.fechaVencimiento).toLocaleDateString('es-DO') : ''),
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Artículo', 'Cant.', 'Precio Unit.', 'Subtotal', 'Proveedor', col6Label]],
          body: artRows,
          margin: { left: mX, right: mX },
          headStyles: {
            fillColor: [235, 244, 255] as [number, number, number],
            textColor: brandBlue,
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'center',
          },
          bodyStyles: { fontSize: 8.5, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 } },
          alternateRowStyles: { fillColor: [248, 252, 255] as [number, number, number] },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 40 },
            2: { halign: 'right', cellWidth: 80 },
            3: { halign: 'right', cellWidth: 80 },
            4: { cellWidth: 80 },
            5: { halign: 'center', cellWidth: 70 },
          },
          didParseCell: (hook) => {
            if (!usaResponsable && hook.section === 'body' && hook.column.index === 5 && hook.cell.raw) {
              const fechaStr = String(hook.cell.raw);
              if (fechaStr) {
                const v = new Date(cat.articulos.find(a =>
                  a.fechaVencimiento && new Date(a.fechaVencimiento).toLocaleDateString('es-DO') === fechaStr
                )?.fechaVencimiento ?? '');
                if (!isNaN(v.getTime()) && v <= new Date()) {
                  hook.cell.styles.textColor = [220, 38, 38];
                  hook.cell.styles.fontStyle = 'bold';
                }
              }
            }
          },
        });

        // Total de categoría
        const finalY = (doc as any).lastAutoTable?.finalY ?? y;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...brandBlue);
        doc.text(`Total ${cat.nombre}: ${fmtMoney(cat.gastoTotal)}`, pageW - mX, finalY + 10, { align: 'right' });
        y = finalY + 22;
      }

      // ── TOTAL GENERAL ─────────────────────────────────────────────────
      const pageH2 = doc.internal.pageSize.getHeight();
      if (y + 30 > pageH2 - 50) { doc.addPage(); y = 50; }
      doc.setDrawColor(...sepColor);
      doc.line(mX, y, pageW - mX, y);
      y += 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...brandBlue);
      doc.text('Gasto Anual Total:', mX, y);
      doc.text(fmtMoney(inventario.gastoAnual), pageW - mX, y, { align: 'right' });

      // ── PIE DE PÁGINA ─────────────────────────────────────────────────
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(170, 170, 170);
        doc.text('Generado con RedCalc', mX, h - 20);
        doc.text(`Página ${i} de ${pages}`, pageW - mX, h - 20, { align: 'right' });
      }

      const safeName = (s: string) => s.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'inventario';
      doc.save(`${safeName(inventario.nombre)}.pdf`);
      toast.success('PDF descargado');
    } catch (e) {
      console.error('Error generating PDF:', e);
      toast.error('Error al generar PDF');
    }
  };

  const exportExcel = async () => {
    if (!inventario) return;
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'RedCalc';
      wb.created = new Date();

      const emp = empresa ?? null;
      const brandBlue = 'FF1564AF';
      const lightBlue = 'FFE8F0FB';
      const safeName = (s: string) => s.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'inventario';
      const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-DO') : '';

      // ── Hoja 1: Resumen ─────────────────────────────────────────────
      const wsRes = wb.addWorksheet('Resumen');
      wsRes.getColumn(1).width = 30;
      wsRes.getColumn(2).width = 20;
      wsRes.getColumn(3).width = 20;
      wsRes.getColumn(4).width = 16;

      let rowNum = 1;

      // Membrete empresa
      if (emp?.empresaNombre) {
        const r = wsRes.getRow(rowNum++);
        r.getCell(1).value = emp.empresaNombre;
        r.getCell(1).font = { bold: true, size: 14, color: { argb: brandBlue } };
        wsRes.mergeCells(`A${r.number}:D${r.number}`);

        const contacto: string[] = [];
        if (emp.empresaRNC) contacto.push(`RNC: ${emp.empresaRNC}`);
        if (emp.empresaTelefono) contacto.push(`Tel: ${emp.empresaTelefono}`);
        if (emp.empresaEmail) contacto.push(emp.empresaEmail);
        if (emp.empresaDireccion) contacto.push(emp.empresaDireccion);
        if (contacto.length) {
          const r2 = wsRes.getRow(rowNum++);
          r2.getCell(1).value = contacto.join('   |   ');
          r2.getCell(1).font = { size: 9, color: { argb: 'FF666666' } };
          wsRes.mergeCells(`A${r2.number}:D${r2.number}`);
        }
        rowNum++; // espacio
      }

      // Título inventario
      const rTitulo = wsRes.getRow(rowNum++);
      rTitulo.getCell(1).value = inventario.nombre;
      rTitulo.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1A1A1A' } };
      wsRes.mergeCells(`A${rTitulo.number}:D${rTitulo.number}`);

      // Metadatos
      const meta: [string, string][] = [
        ['Cliente', inventario.client.nombre],
        ['Estado', inventario.estado === 'completado' ? 'Completado' : inventario.estado === 'archivado' ? 'Archivado' : 'Borrador'],
        ['Fecha', fmtDate(inventario.fecha)],
        ['Generado', new Date().toLocaleDateString('es-DO')],
      ];
      for (const [k, v] of meta) {
        const r = wsRes.getRow(rowNum++);
        r.getCell(1).value = k;
        r.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF555555' } };
        r.getCell(2).value = v;
        r.getCell(2).font = { size: 10 };
      }
      rowNum++;

      // Encabezado tabla resumen
      const hRes = wsRes.getRow(rowNum++);
      const resCols = ['Categoría', 'Artículos', 'Gasto Total', '% del Total'];
      resCols.forEach((h, i) => {
        hRes.getCell(i + 1).value = h;
        hRes.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandBlue } };
        hRes.getCell(i + 1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        hRes.getCell(i + 1).alignment = { horizontal: 'center', vertical: 'middle' };
      });
      hRes.height = 24;

      for (const cat of inventario.categorias) {
        const r = wsRes.getRow(rowNum++);
        r.getCell(1).value = cat.nombre;
        r.getCell(2).value = cat.articulos.length;
        r.getCell(2).alignment = { horizontal: 'center' };
        r.getCell(3).value = cat.gastoTotal;
        r.getCell(3).numFmt = '"$"#,##0.00';
        r.getCell(3).alignment = { horizontal: 'right' };
        r.getCell(4).value = inventario.gastoAnual > 0 ? `${((cat.gastoTotal / inventario.gastoAnual) * 100).toFixed(1)}%` : '0%';
        r.getCell(4).alignment = { horizontal: 'right' };
        r.eachCell(cell => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9DFE8' } } };
        });
      }

      // Fila total
      const rTotal = wsRes.getRow(rowNum++);
      rTotal.getCell(1).value = 'TOTAL GENERAL';
      rTotal.getCell(1).font = { bold: true, color: { argb: brandBlue } };
      rTotal.getCell(2).value = inventario.categorias.reduce((s, c) => s + c.articulos.length, 0);
      rTotal.getCell(2).alignment = { horizontal: 'center' };
      rTotal.getCell(2).font = { bold: true };
      rTotal.getCell(3).value = inventario.gastoAnual;
      rTotal.getCell(3).numFmt = '"$"#,##0.00';
      rTotal.getCell(3).alignment = { horizontal: 'right' };
      rTotal.getCell(3).font = { bold: true, color: { argb: brandBlue } };
      rTotal.getCell(4).value = '100%';
      rTotal.getCell(4).alignment = { horizontal: 'right' };
      rTotal.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBlue } };
        cell.border = { top: { style: 'medium', color: { argb: 'FF1564AF' } } };
      });

      // ── Hoja 2: Artículos completos ──────────────────────────────────
      const wsArt = wb.addWorksheet('Artículos');
      wsArt.columns = [
        { header: 'Categoría',       key: 'cat',          width: 22 },
        { header: 'Artículo',        key: 'nombre',       width: 32 },
        { header: 'Descripción',     key: 'desc',         width: 30 },
        { header: 'Cantidad',        key: 'cant',         width: 12 },
        { header: 'Precio Unit.',    key: 'precio',       width: 15 },
        { header: 'Subtotal',        key: 'subtotal',     width: 15 },
        { header: 'Proveedor',       key: 'prov',         width: 22 },
        { header: 'Responsable',     key: 'responsable',  width: 22 },
        { header: 'Vencimiento',     key: 'venc',         width: 15 },
        { header: 'Notas',           key: 'notas',        width: 28 },
      ];

      const hArt = wsArt.getRow(1);
      hArt.height = 24;
      hArt.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandBlue } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      wsArt.views = [{ state: 'frozen', ySplit: 1 }];

      let artRowNum = 2;
      for (const cat of inventario.categorias) {
        // Fila de categoría
        const rCat = wsArt.getRow(artRowNum++);
        const catCell = rCat.getCell(1);
        catCell.value = cat.nombre;
        catCell.font = { bold: true, color: { argb: brandBlue } };
        wsArt.mergeCells(`A${rCat.number}:J${rCat.number}`);
        rCat.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FB' } };

        for (const art of cat.articulos) {
          const r = wsArt.getRow(artRowNum++);
          r.getCell(1).value = cat.nombre;
          r.getCell(2).value = art.nombre;
          r.getCell(3).value = art.descripcion ?? '';
          r.getCell(4).value = art.cantidad;
          r.getCell(4).alignment = { horizontal: 'center' };
          r.getCell(5).value = art.precioUnitario;
          r.getCell(5).numFmt = '"$"#,##0.00';
          r.getCell(5).alignment = { horizontal: 'right' };
          r.getCell(6).value = art.subtotal;
          r.getCell(6).numFmt = '"$"#,##0.00';
          r.getCell(6).alignment = { horizontal: 'right' };
          r.getCell(7).value = art.proveedor ?? '';
          r.getCell(8).value = art.responsable ?? '';
          r.getCell(9).value = art.fechaVencimiento ? new Date(art.fechaVencimiento).toLocaleDateString('es-DO') : '';
          r.getCell(9).alignment = { horizontal: 'center' };
          if (art.fechaVencimiento && new Date(art.fechaVencimiento) <= new Date()) {
            r.getCell(9).font = { bold: true, color: { argb: 'FFDC2626' } };
          }
          r.getCell(10).value = art.notas ?? '';
          r.eachCell(cell => {
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
          });
        }
      }

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${safeName(inventario.nombre)}.xlsx`);
      toast.success('Excel descargado');
    } catch (e) {
      console.error('Error generating Excel:', e);
      toast.error('Error al generar Excel');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><p className="text-gray-400">Cargando reporte...</p></div>;
  }

  if (!inventario) {
    return <div className="text-center py-12"><p className="text-gray-500">Inventario no encontrado</p></div>;
  }

  const pieData = inventario.categorias.filter(c => c.gastoTotal > 0).map(c => ({ name: c.nombre, value: c.gastoTotal }));
  const expiredArticulos = getExpiredArticulos();
  const expiringSoon = getExpiringSoon();
  const totalArticulos = inventario.categorias.reduce((s, c) => s + c.articulos.length, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">{inventario.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">{inventario.client.nombre}</p>
          {inventario.fecha && (
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(inventario.fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-1" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-2 text-red-600" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-600 font-medium">Categorías</p>
            <p className="text-3xl font-bold text-blue-900">{inventario.categorias.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 font-medium">Artículos</p>
            <p className="text-3xl font-bold text-green-900">{totalArticulos}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="pt-6">
            <p className="text-sm text-indigo-600 font-medium">Gasto Anual</p>
            <p className="text-2xl font-bold text-indigo-900">${inventario.gastoAnual.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas vencimientos */}
      {(expiredArticulos.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-3">
          {expiredArticulos.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5" /> Vencidos ({expiredArticulos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-red-800">
                  {expiredArticulos.slice(0, 5).map(a => (
                    <li key={a.id}>• {a.nombre} <span className="text-red-500">({a.categoriaNombre})</span></li>
                  ))}
                  {expiredArticulos.length > 5 && <li className="text-red-600">+ {expiredArticulos.length - 5} más</li>}
                </ul>
              </CardContent>
            </Card>
          )}
          {expiringSoon.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-900">
                  <AlertTriangle className="w-5 h-5" /> Por vencer en 30 días ({expiringSoon.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {expiringSoon.slice(0, 5).map(a => (
                    <li key={a.id}>• {a.nombre} — vence {new Date(a.fechaVencimiento!).toLocaleDateString('es-DO')}</li>
                  ))}
                  {expiringSoon.length > 5 && <li>+ {expiringSoon.length - 5} más</li>}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráfico de torta */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Distribución por Categoría</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla resumen por categoría */}
      <Card>
        <CardHeader><CardTitle>Resumen por Categoría</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1564AF] text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold rounded-tl-md">Categoría</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Artículos</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Gasto Total</th>
                  <th className="text-right px-4 py-2.5 font-semibold rounded-tr-md">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {inventario.categorias.map((cat, i) => (
                  <tr key={cat.id} className={`border-b ${i % 2 === 0 ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium">{cat.nombre}</td>
                    <td className="text-center px-4 py-2.5">{cat.articulos.length}</td>
                    <td className="text-right px-4 py-2.5 font-semibold">${cat.gastoTotal.toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5 text-gray-500">
                      {inventario.gastoAnual > 0 ? `${((cat.gastoTotal / inventario.gastoAnual) * 100).toFixed(1)}%` : '0%'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#1564AF]/10 font-bold border-t-2 border-[#1564AF]/30">
                  <td className="px-4 py-2.5 text-[#1564AF]">Total</td>
                  <td className="text-center px-4 py-2.5">{totalArticulos}</td>
                  <td className="text-right px-4 py-2.5 text-[#1564AF]">${inventario.gastoAnual.toLocaleString()}</td>
                  <td className="text-right px-4 py-2.5">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detalle por categoría */}
      {inventario.categorias.map(cat => (
        <Card key={cat.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{cat.nombre}</span>
              <span className="text-sm font-normal text-gray-500">${cat.gastoTotal.toLocaleString()} total</span>
            </CardTitle>
            {cat.descripcion && <p className="text-xs text-gray-400">{cat.descripcion}</p>}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {(() => {
                const usaResponsable = cat.articulos.some(a => a.responsable);
                return (
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50 border-b border-blue-200">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-[#1564AF]">Artículo</th>
                        <th className="text-center px-3 py-2 font-semibold text-[#1564AF]">Cant.</th>
                        <th className="text-right px-3 py-2 font-semibold text-[#1564AF]">P. Unit.</th>
                        <th className="text-right px-3 py-2 font-semibold text-[#1564AF]">Subtotal</th>
                        <th className="text-left px-3 py-2 font-semibold text-[#1564AF]">Proveedor</th>
                        <th className="text-center px-3 py-2 font-semibold text-[#1564AF]">
                          {usaResponsable ? 'Responsable' : 'Vencimiento'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.articulos.map((art, i) => {
                        const vencido = !usaResponsable && art.fechaVencimiento && new Date(art.fechaVencimiento) <= new Date();
                        return (
                          <tr key={art.id} className={`border-b ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-3 py-2">
                              <p className="font-medium">{art.nombre}</p>
                              {art.descripcion && <p className="text-xs text-gray-400">{art.descripcion}</p>}
                              {art.notas && <p className="text-xs text-gray-400 italic">{art.notas}</p>}
                            </td>
                            <td className="text-center px-3 py-2">{art.cantidad}</td>
                            <td className="text-right px-3 py-2">${art.precioUnitario.toLocaleString()}</td>
                            <td className="text-right px-3 py-2 font-medium">${art.subtotal.toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{art.proveedor ?? '—'}</td>
                            <td className={`text-center px-3 py-2 text-xs ${vencido ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {usaResponsable
                                ? (art.responsable ?? '—')
                                : (art.fechaVencimiento ? new Date(art.fechaVencimiento).toLocaleDateString('es-DO') : '—')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
