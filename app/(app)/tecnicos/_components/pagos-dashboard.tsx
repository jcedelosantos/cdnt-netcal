'use client';
import { useState, useEffect } from 'react';
import { Plus, Loader2, DollarSign, CheckCircle2, Clock, AlertTriangle, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Formateador de fechas limpio para jsPDF (sin toLocaleDateString)
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const fmtD  = (s: string) => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
const fmtDY = (s: string) => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()}/${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`; };
const fmtHoy = () => { const d = new Date(); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const fmtRango = (start: string, end: string) => {
  if (start === end) return fmtD(start);
  const d1 = new Date(start + 'T12:00:00'), d2 = new Date(end + 'T12:00:00');
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
    ? `${d1.getDate()}–${d2.getDate()} ${MESES[d1.getMonth()]} ${d1.getFullYear()}`
    : `${fmtD(start)} – ${fmtD(end)} ${d2.getFullYear()}`;
};

const ESTADOS: Record<string, { label: string; cls: string }> = {
  borrador: { label: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
  revision: { label: 'En revisión', cls: 'bg-amber-100 text-amber-800' },
  aprobado: { label: 'Aprobado', cls: 'bg-blue-100 text-blue-800' },
  parcial: { label: 'Parcialmente pagado', cls: 'bg-violet-100 text-violet-800' },
  pagado: { label: 'Pagado', cls: 'bg-emerald-100 text-emerald-800' },
  anulado: { label: 'Anulado', cls: 'bg-red-100 text-red-800' },
};

interface Props {
  tecnicos: any[];
  jornadas: any[];
  onRefresh: () => void;
}

export default function PagosDashboard({ tecnicos, jornadas, onRefresh }: Props) {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [anticipos, setAnticipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevoPeriodo, setShowNuevoPeriodo] = useState(false);
  const [showAnticipoForm, setShowAnticipoForm] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState<any>(null);
  const [cerrando, setCerrando] = useState('');
  const [empresa, setEmpresa] = useState<any>({});

  const loadPeriodos = async () => {
    const [pRes, aRes, cfgRes] = await Promise.all([
      fetch('/api/periodos-pago'),
      fetch('/api/anticipos'),
      fetch('/api/configuracion'),
    ]);
    if (pRes.ok) setPeriodos(await pRes.json());
    if (aRes.ok) setAnticipos(await aRes.json());
    if (cfgRes.ok) { const d = await cfgRes.json(); setEmpresa(d.config ?? {}); }
    setLoading(false);
  };

  useEffect(() => { loadPeriodos(); }, []);

  const handleCierre = async (periodoId: string) => {
    if (!confirm('¿Procesar cierre semanal? Se agruparán todas las jornadas aprobadas del periodo.')) return;
    setCerrando(periodoId);
    const res = await fetch(`/api/periodos-pago/${periodoId}/cierre`, { method: 'POST' });
    const data = await res.json();
    setCerrando('');
    if (res.ok) {
      alert(`Cierre procesado: ${data.jornadasProcesadas} jornadas, ${data.tecnicosIncluidos} técnicos. Total neto: RD$ ${data.totalNeto?.toLocaleString()}`);
      loadPeriodos();
      onRefresh();
    } else {
      alert(data.error ?? 'Error al procesar cierre');
    }
  };

  const handleEstado = async (id: string, estado: string) => {
    await fetch(`/api/periodos-pago/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) });
    loadPeriodos();
  };

  const [revirtiendo, setRevirtiendo] = useState('');

  const handleRevertir = async (p: any) => {
    if (!confirm(`¿Revertir el cierre de "${p.nombre}"?\n\nLas jornadas quedarán sin pagar y los anticipos aplicados volverán a estar pendientes. Podrás procesar el cierre nuevamente.`)) return;
    setRevirtiendo(p.id);
    const res = await fetch(`/api/periodos-pago/${p.id}/revertir`, { method: 'POST' });
    const data = await res.json();
    setRevirtiendo('');
    if (res.ok) {
      alert(`Cierre revertido. ${data.jornadasLiberadas} jornada(s) liberadas.`);
      loadPeriodos();
      onRefresh();
    } else {
      alert(data.error ?? 'Error al revertir');
    }
  };

  const exportPDF = async (p: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PRI: [number, number, number] = [21, 100, 175];
    const pageW = doc.internal.pageSize.getWidth();

    // Encabezado empresa
    const headerH = await buildHeader(doc, pageW);

    // ── Título del documento ────────────────────────────────────────
    const titleY = headerH + 10;
    doc.setFontSize(13);
    doc.setTextColor(...PRI);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE NÓMINA', 14, titleY);

    // Info del período (columna derecha)
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    const estado = p.estado.toUpperCase();
    doc.text(`Período: ${p.nombre}`, pageW - 14, titleY - 6, { align: 'right' });
    doc.text(fmtRango(p.fechaInicio.split('T')[0], p.fechaFin.split('T')[0]), pageW - 14, titleY, { align: 'right' });
    doc.text(`Estado: ${estado}`, pageW - 14, titleY + 5, { align: 'right' });
    doc.text(`Emisión: ${fmtHoy()}`, pageW - 14, titleY + 10, { align: 'right' });

    // Línea fina gris
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(14, titleY + 14, pageW - 14, titleY + 14);

    // ── Tabla de técnicos ───────────────────────────────────────────
    const tableY = titleY + 18;
    const rows = (p.detalles ?? []).map((d: any) => {
      const tec = tecnicos.find((t: any) => t.id === d.tecnicoId);
      const jornadasTec = jornadas.filter((j: any) => j.tecnicoId === d.tecnicoId && j.periodoPagoId === p.id);
      const starts = jornadasTec.map((j: any) => j.fecha?.split('T')[0]).sort();
      const ends = jornadasTec.map((j: any) => (j.fechaFin ? j.fechaFin.split('T')[0] : j.fecha?.split('T')[0])).sort();
      const rango = starts.length > 0 ? fmtRango(starts[0], ends[ends.length - 1]) : '—';
      return [
        tec?.nombre ?? '—',
        tec?.rol?.nombre ?? tec?.tipoContratacion ?? '—',
        rango,
        String(d.diasTrabajados ?? 1),
        `RD$ ${(d.pagoBruto || 0).toLocaleString()}`,
        d.anticipos > 0 ? `- RD$ ${d.anticipos.toLocaleString()}` : '—',
        `RD$ ${(d.pagoNeto || 0).toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: tableY,
      head: [['Técnico', 'Rol', 'Período trabajado', 'Días', 'Bruto', 'Anticipos', 'Neto a pagar']],
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 3.5 },
      headStyles: { fillColor: PRI, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 32 },
        2: { cellWidth: 36 },
        3: { cellWidth: 13, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 26, halign: 'right' },
        6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
    });

    // ── Resumen de totales ──────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const colL = 120;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Total bruto:', colL, finalY);
    doc.text(`RD$ ${(p.totalBruto || 0).toLocaleString()}`, pageW - 14, finalY, { align: 'right' });

    if (p.totalAnticipos > 0) {
      doc.text('Anticipos aplicados:', colL, finalY + 6);
      doc.text(`- RD$ ${(p.totalAnticipos).toLocaleString()}`, pageW - 14, finalY + 6, { align: 'right' });
    }
    if (p.totalDescuentos > 0) {
      doc.text('Descuentos:', colL, finalY + 12);
      doc.text(`- RD$ ${(p.totalDescuentos).toLocaleString()}`, pageW - 14, finalY + 12, { align: 'right' });
    }

    // Caja total neto
    const netoY = finalY + (p.totalAnticipos > 0 || p.totalDescuentos > 0 ? 18 : 8);
    doc.setFillColor(...PRI);
    doc.roundedRect(colL - 4, netoY - 6, pageW - 14 - colL + 4, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255);
    doc.text('TOTAL NETO A PAGAR:', colL, netoY + 1);
    doc.text(`RD$ ${(p.totalNeto || 0).toLocaleString()}`, pageW - 17, netoY + 1, { align: 'right' });

    // ── Pie de página ───────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 16, pageW - 14, pageH - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(empresa.empresaNombre || '', 14, pageH - 10);
    doc.text(`Generado con RedCalc · ${fmtHoy()}`, pageW - 14, pageH - 10, { align: 'right' });

    const filename = `nomina-${p.nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
    doc.save(filename);
  };

  // ── Helper: encabezado empresa reutilizable ─────────────────────────────────
  const buildHeader = async (doc: any, pageW: number) => {
    const PRI: [number, number, number] = [21, 100, 175];
    let logoH = 0;
    if (empresa.empresaLogo) {
      try {
        const ext = empresa.empresaLogo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(empresa.empresaLogo, ext, 14, 10, 26, 26);
        logoH = 28;
      } catch (_) {}
    }
    const textX = empresa.empresaLogo ? 44 : 14;
    doc.setFontSize(14); doc.setTextColor(...PRI); doc.setFont('helvetica', 'bold');
    doc.text(empresa.empresaNombre || 'Mi Empresa', textX, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80);
    let y = 24;
    if (empresa.empresaRNC)       { doc.text(`RNC: ${empresa.empresaRNC}`, textX, y); y += 4.5; }
    if (empresa.empresaTelefono)  { doc.text(`Tel: ${empresa.empresaTelefono}`, textX, y); y += 4.5; }
    if (empresa.empresaDireccion) { doc.text(empresa.empresaDireccion, textX, y); y += 4.5; }
    if (empresa.empresaEmail)     { doc.text(empresa.empresaEmail, textX, y); y += 4.5; }
    const headerH = Math.max(logoH, y) + 2;
    doc.setDrawColor(...PRI); doc.setLineWidth(0.7);
    doc.line(14, headerH, pageW - 14, headerH);
    return headerH;
  };

  // ── PDF individual por técnico ──────────────────────────────────────────────
  const exportPDFTecnico = async (p: any, d: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PRI: [number, number, number] = [21, 100, 175];
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const tec = tecnicos.find((t: any) => t.id === d.tecnicoId);
    const jornadasTec = jornadas.filter((j: any) => j.tecnicoId === d.tecnicoId && j.periodoPagoId === p.id);

    // Encabezado empresa
    const headerH = await buildHeader(doc, pageW);

    // Título
    const titleY = headerH + 10;
    doc.setFontSize(13); doc.setTextColor(...PRI); doc.setFont('helvetica', 'bold');
    doc.text('RECIBO INDIVIDUAL DE PAGO', 14, titleY);

    // Número de recibo (si existe)
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${p.nombre}`, pageW - 14, titleY - 5, { align: 'right' });
    doc.text(fmtRango(p.fechaInicio.split('T')[0], p.fechaFin.split('T')[0]), pageW - 14, titleY + 1, { align: 'right' });
    doc.text(`Emisión: ${fmtHoy()}`, pageW - 14, titleY + 7, { align: 'right' });

    doc.setDrawColor(220); doc.setLineWidth(0.3);
    doc.line(14, titleY + 11, pageW - 14, titleY + 11);

    // ── Ficha del técnico ───────────────────────────────────────────
    const fichaY = titleY + 17;
    doc.setFillColor(247, 249, 252);
    doc.roundedRect(14, fichaY, pageW - 28, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PRI);
    doc.text(tec?.nombre ?? '—', 20, fichaY + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80);
    doc.text(`Rol: ${tec?.rol?.nombre ?? tec?.tipoContratacion ?? '—'}`, 20, fichaY + 14);
    if (tec?.cedula) doc.text(`Cédula: ${tec.cedula}`, 20, fichaY + 19);
    if (tec?.telefono) doc.text(`Tel: ${tec.telefono}`, 80, fichaY + 14);
    // Días trabajados badge
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...PRI);
    doc.text(`${d.diasTrabajados ?? 1}`, pageW - 40, fichaY + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(120);
    doc.text('días trabajados', pageW - 40, fichaY + 16, { align: 'center' });

    // ── Tabla de jornadas ───────────────────────────────────────────
    const tableY = fichaY + 30;
    const jorRows = jornadasTec.map((j: any) => {
      const start = j.fecha?.split('T')[0];
      const end = j.fechaFin ? j.fechaFin.split('T')[0] : start;
      const periodo = fmtRango(start, end);
      return [
        periodo,
        String(j.diasTrabajados ?? 1),
        j.project?.nombre ?? '—',
        j.tipoJornada?.replace('_', ' ') ?? '—',
        `RD$ ${(j.tarifaDia || 0).toLocaleString()}`,
        j.horasExtra > 0 ? `${j.horasExtra}h` : '—',
        `RD$ ${(j.totalJornada || 0).toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: tableY,
      head: [['Período', 'Días', 'Proyecto', 'Tipo jornada', 'Tarifa/día', 'H. Extra', 'Total']],
      body: jorRows,
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: PRI, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 48 },
        3: { cellWidth: 26 },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      },
    });

    // ── Desglose de pago ────────────────────────────────────────────
    const sumY = (doc as any).lastAutoTable.finalY + 8;
    const colL = 110;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80);
    doc.text('Pago bruto:', colL, sumY);
    doc.text(`RD$ ${(d.pagoBruto || 0).toLocaleString()}`, pageW - 14, sumY, { align: 'right' });
    let offsetY = 6;
    if (d.bonificaciones > 0) {
      doc.text('Bonificaciones:', colL, sumY + offsetY);
      doc.text(`+ RD$ ${d.bonificaciones.toLocaleString()}`, pageW - 14, sumY + offsetY, { align: 'right' });
      offsetY += 6;
    }
    if (d.anticipos > 0) {
      doc.text('Anticipos descontados:', colL, sumY + offsetY);
      doc.text(`- RD$ ${d.anticipos.toLocaleString()}`, pageW - 14, sumY + offsetY, { align: 'right' });
      offsetY += 6;
    }
    if (d.descuentos > 0) {
      doc.text('Otros descuentos:', colL, sumY + offsetY);
      doc.text(`- RD$ ${d.descuentos.toLocaleString()}`, pageW - 14, sumY + offsetY, { align: 'right' });
      offsetY += 6;
    }
    // Caja neto
    const netoBoxY = sumY + offsetY + 2;
    doc.setFillColor(...PRI);
    doc.roundedRect(colL - 4, netoBoxY - 5, pageW - 14 - colL + 4, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255);
    doc.text('NETO A PAGAR:', colL, netoBoxY + 2);
    doc.text(`RD$ ${(d.pagoNeto || 0).toLocaleString()}`, pageW - 17, netoBoxY + 2, { align: 'right' });

    // ── Firma y sello empresa ────────────────────────────────────────
    const firmaY = netoBoxY + 20;
    // Cargar imagen de firma/sello y remover fondo negro
    let firmaDataUrl: string | null = null;
    try {
      const firmaImg = new Image();
      firmaImg.src = '/firma-sello.png';
      await new Promise<void>((res, rej) => { firmaImg.onload = () => res(); firmaImg.onerror = rej; });
      const cv = document.createElement('canvas');
      cv.width = firmaImg.width; cv.height = firmaImg.height;
      const cx = cv.getContext('2d')!;
      cx.drawImage(firmaImg, 0, 0);
      const id = cx.getImageData(0, 0, cv.width, cv.height);
      const px = id.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] < 60 && px[i+1] < 60 && px[i+2] < 60) px[i+3] = 0;
      }
      cx.putImageData(id, 0, 0);
      firmaDataUrl = cv.toDataURL('image/png');
    } catch (_) {}

    // Líneas de firma
    doc.setDrawColor(150); doc.setLineWidth(0.4);
    doc.line(14, firmaY + 22, 85, firmaY + 22);
    doc.line(pageW - 85, firmaY + 22, pageW - 14, firmaY + 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text('Firma del técnico', 49, firmaY + 28, { align: 'center' });
    doc.text(tec?.nombre ?? '', 49, firmaY + 33, { align: 'center' });
    doc.text('Autorizado por empresa', pageW - 49, firmaY + 28, { align: 'center' });
    doc.text(empresa.empresaNombre || '', pageW - 49, firmaY + 33, { align: 'center' });
    // Firma/sello sobre la línea derecha
    if (firmaDataUrl) {
      const selloW = 45, selloH = 30;
      doc.addImage(firmaDataUrl, 'PNG', pageW - 14 - selloW, firmaY - 6, selloW, selloH);
    }

    // ── Pie ─────────────────────────────────────────────────────────
    doc.setDrawColor(200); doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.setFontSize(7.5); doc.setTextColor(150);
    doc.text(empresa.empresaNombre || '', 14, pageH - 8);
    doc.text(`Generado con RedCalc · ${fmtHoy()}`, pageW - 14, pageH - 8, { align: 'right' });

    const nombre = (tec?.nombre ?? 'tecnico').replace(/\s+/g, '-').toLowerCase();
    doc.save(`recibo-${nombre}-${p.nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`);
  };

  const pendientesAnticipo = anticipos.filter(a => a.estado === 'pendiente');
  const totalPendientePago = jornadas.filter(j => !j.periodoPagoId && j.estado === 'aprobado').reduce((s, j) => s + (j.totalJornada || 0), 0);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Pend. de pago (aprobadas)</p>
            <p className="text-xl font-bold">RD$ {totalPendientePago.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Anticipos sin aplicar</p>
            <p className="text-xl font-bold">{pendientesAnticipo.length}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Periodos pagados</p>
            <p className="text-xl font-bold">{periodos.filter(p => p.estado === 'pagado').length}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold">Periodos de Pago</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAnticipoForm(true)}>
            <DollarSign className="w-4 h-4 mr-1.5" /> Registrar Anticipo
          </Button>
          <Button size="sm" onClick={() => setShowNuevoPeriodo(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Periodo
          </Button>
        </div>
      </div>

      {/* Anticipos pendientes banner */}
      {pendientesAnticipo.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Anticipos pendientes de aplicar</p>
            <div className="mt-1 space-y-0.5">
              {pendientesAnticipo.map(a => (
                <p key={a.id} className="text-xs text-amber-700">• {a.tecnico?.nombre} — RD$ {a.monto.toLocaleString()} ({new Date(a.fecha).toLocaleDateString('es-DO')})</p>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-1">Se aplicarán automáticamente en el próximo cierre.</p>
          </div>
        </div>
      )}

      {/* Periods list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : periodos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay periodos de pago creados</p>
          <Button size="sm" className="mt-3" onClick={() => setShowNuevoPeriodo(true)}>Crear primer periodo</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {periodos.map(p => {
            const est = ESTADOS[p.estado] ?? { label: p.estado, cls: 'bg-muted text-foreground' };
            return (
              <div key={p.id} className="bg-white border rounded-xl p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{p.nombre}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.cls}`}>{est.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(() => {
                        const rango = fmtRango(p.fechaInicio.split('T')[0], p.fechaFin.split('T')[0]);
                        const totalDias = (p.detalles ?? []).reduce((s: number, d: any) => s + (d.diasTrabajados ?? 1), 0);
                        const label = totalDias > 0 ? `${totalDias} días` : `${p._count?.jornadas ?? 0} registros`;
                        return `${rango} · ${label}`;
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Neto</p>
                      <p className="font-bold text-primary">RD$ {(p.totalNeto || 0).toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={() => exportPDF(p)}
                      title="Descargar PDF de nómina"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Detalle de técnicos */}
                {p.detalles && p.detalles.length > 0 && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-2">
                    {p.detalles.map((d: any) => {
                      const tec = tecnicos.find(t => t.id === d.tecnicoId);
                      // Jornadas de este técnico en este período
                      const jornadasTec = jornadas.filter(j => j.tecnicoId === d.tecnicoId && j.periodoPagoId === p.id);
                      const fechasRango = jornadasTec.length > 0 ? (() => {
                        const starts = jornadasTec.map(j => j.fecha?.split('T')[0]).sort();
                        const ends = jornadasTec.map(j => j.fechaFin ? j.fechaFin.split('T')[0] : j.fecha?.split('T')[0]).sort();
                        return fmtRango(starts[0], ends[ends.length - 1]);
                      })() : null;
                      return (
                        <div key={d.id} className="text-xs bg-muted/40 rounded-lg p-2 flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{tec?.nombre ?? d.tecnicoId}</p>
                            {fechasRango && <p className="text-primary/80 font-medium">{fechasRango}</p>}
                            <p className="text-muted-foreground">{d.diasTrabajados}d · RD$ {d.pagoNeto.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => exportPDFTecnico(p, d)}
                            title="Descargar recibo individual"
                            className="shrink-0 p-1 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {p.estado === 'borrador' && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleCierre(p.id)} disabled={cerrando === p.id}>
                      {cerrando === p.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Procesar cierre
                    </Button>
                  )}
                  {p.estado === 'revision' && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleEstado(p.id, 'aprobado')}>
                      Aprobar
                    </Button>
                  )}
                  {p.estado === 'aprobado' && (
                    <Button size="sm" className="text-xs" onClick={() => handleEstado(p.id, 'pagado')}>
                      Marcar como pagado
                    </Button>
                  )}
                  {['revision', 'aprobado', 'pagado'].includes(p.estado) && (
                    <Button
                      size="sm" variant="outline"
                      className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => handleRevertir(p)}
                      disabled={revirtiendo === p.id}
                    >
                      {revirtiendo === p.id
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        : null}
                      Rehacer cierre
                    </Button>
                  )}
                  {!['pagado', 'anulado'].includes(p.estado) && (
                    <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive" onClick={() => handleEstado(p.id, 'anulado')}>
                      Anular
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nuevo periodo */}
      {showNuevoPeriodo && (
        <NuevoPeriodoModal onClose={() => setShowNuevoPeriodo(false)} onSaved={() => { setShowNuevoPeriodo(false); loadPeriodos(); }} />
      )}

      {/* Modal: Anticipo */}
      {showAnticipoForm && (
        <AnticipoModal tecnicos={tecnicos} onClose={() => setShowAnticipoForm(false)} onSaved={() => { setShowAnticipoForm(false); loadPeriodos(); }} />
      )}
    </div>
  );
}

// ─── New Period Modal ─────────────────────────────────────────────────────────
function NuevoPeriodoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - now.getDay() + 1);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const [form, setForm] = useState({
    nombre: `Semana ${monday.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })} – ${sunday.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}`,
    tipo: 'semanal',
    fechaInicio: fmt(monday),
    fechaFin: fmt(sunday),
    notas: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/periodos-pago', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">Nuevo Periodo de Pago</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <Label>Nombre del periodo</Label>
            <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} required />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Tipo</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {['diario','semanal','quincenal','mensual','proyecto','personalizado'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <Label>Notas</Label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm resize-none" rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Crear periodo</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Anticipo Modal ───────────────────────────────────────────────────────────
function AnticipoModal({ tecnicos, onClose, onSaved }: { tecnicos: any[]; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tecnicoId: '', fecha: new Date().toISOString().split('T')[0], monto: '', motivo: '', metodoPago: '', referencia: '', autorizadoPor: '', notas: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/anticipos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">Registrar Anticipo</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <Label>Técnico *</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tecnicoId} onChange={e => set('tecnicoId', e.target.value)} required>
              <option value="">Seleccionar...</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div>
              <Label>Monto (RD$) *</Label>
              <Input type="number" min="0.01" step="0.01" value={form.monto} onChange={e => set('monto', e.target.value)} required placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Motivo del anticipo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Método de pago</Label>
              <Input value={form.metodoPago} onChange={e => set('metodoPago', e.target.value)} placeholder="Efectivo, transferencia..." />
            </div>
            <div>
              <Label>Referencia</Label>
              <Input value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="Núm. referencia" />
            </div>
          </div>
          <div>
            <Label>Autorizado por</Label>
            <Input value={form.autorizadoPor} onChange={e => set('autorizadoPor', e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Registrar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
