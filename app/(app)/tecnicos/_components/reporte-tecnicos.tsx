'use client';
import { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  tecnicos: any[];
  jornadas: any[];
  proyectos: any[];
}

export default function ReporteTecnicos({ tecnicos, jornadas, proyectos }: Props) {
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const filtered = useMemo(() => {
    return jornadas.filter(j => {
      if (filtroTecnico && j.tecnicoId !== filtroTecnico) return false;
      if (filtroProyecto && j.projectId !== filtroProyecto) return false;
      if (filtroEstado && j.estado !== filtroEstado) return false;
      if (fechaInicio && new Date(j.fecha) < new Date(fechaInicio)) return false;
      if (fechaFin && new Date(j.fecha) > new Date(fechaFin + 'T23:59:59')) return false;
      return true;
    });
  }, [jornadas, filtroTecnico, filtroProyecto, filtroEstado, fechaInicio, fechaFin]);

  // Group by tecnico
  const byTecnico = useMemo(() => {
    const map: Record<string, { tecnico: any; jornadas: any[] }> = {};
    for (const j of filtered) {
      if (!map[j.tecnicoId]) {
        map[j.tecnicoId] = { tecnico: j.tecnico, jornadas: [] };
      }
      map[j.tecnicoId].jornadas.push(j);
    }
    return Object.values(map);
  }, [filtered]);

  const totalBruto = filtered.reduce((s, j) => s + (j.totalJornada || 0), 0);
  const totalDias = filtered.length;
  const totalHE = filtered.reduce((s, j) => s + (j.horasExtra || 0), 0);

  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reporte Técnicos');

    ws.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Técnico', key: 'tecnico', width: 24 },
      { header: 'Proyecto', key: 'proyecto', width: 28 },
      { header: 'Tipo Jornada', key: 'tipo', width: 16 },
      { header: 'Horas', key: 'horas', width: 10 },
      { header: 'H. Extra', key: 'hextra', width: 10 },
      { header: 'Tarifa/día', key: 'tarifa', width: 12 },
      { header: 'Bonificación', key: 'bono', width: 12 },
      { header: 'Viáticos', key: 'viaticos', width: 12 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Estado', key: 'estado', width: 14 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1564AF' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const j of filtered) {
      ws.addRow({
        fecha: new Date(j.fecha).toLocaleDateString('es-DO'),
        tecnico: j.tecnico?.nombre ?? '',
        proyecto: j.project?.nombre ?? '',
        tipo: j.tipoJornada,
        horas: j.horasTotales,
        hextra: j.horasExtra,
        tarifa: j.tarifaDia,
        bono: j.bonificacion,
        viaticos: j.viaticos,
        total: j.totalJornada,
        estado: j.estado,
      });
    }

    // Totals row
    const totRow = ws.addRow({ fecha: 'TOTAL', tecnico: '', proyecto: '', tipo: '', horas: '', hextra: totalHE, tarifa: '', bono: '', viaticos: '', total: totalBruto, estado: `${totalDias} jornadas` });
    totRow.font = { bold: true };
    totRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `reporte-tecnicos-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.setTextColor(21, 100, 175);
    doc.text('Reporte de Técnicos y Jornadas', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })} · ${filtered.length} registros`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Técnico', 'Proyecto', 'Tipo', 'Horas', 'H.Extra', 'Total RD$', 'Estado']],
      body: filtered.map(j => [
        new Date(j.fecha).toLocaleDateString('es-DO'),
        j.tecnico?.nombre ?? '—',
        j.project?.nombre ?? '—',
        j.tipoJornada,
        j.horasTotales,
        j.horasExtra,
        (j.totalJornada || 0).toLocaleString(),
        j.estado,
      ]),
      styles: { fontSize: 7.5, cellPadding: 3 },
      headStyles: { fillColor: [21, 100, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      foot: [[`Total: ${totalDias} jornadas`, '', '', '', '', `${totalHE}h ext`, `RD$ ${totalBruto.toLocaleString()}`, '']],
      footStyles: { fillColor: [230, 235, 245], fontStyle: 'bold' },
    });

    doc.save(`reporte-tecnicos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-1.5"><Filter className="w-4 h-4" /> Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Técnico</Label>
            <select className="w-full border rounded-md px-2 py-1.5 text-sm" value={filtroTecnico} onChange={e => setFiltroTecnico(e.target.value)}>
              <option value="">Todos</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Proyecto</Label>
            <select className="w-full border rounded-md px-2 py-1.5 text-sm" value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)}>
              <option value="">Todos</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Estado</Label>
            <select className="w-full border rounded-md px-2 py-1.5 text-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              {['programado','presente','ausente','cancelado','pendiente','aprobado'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Desde</Label>
            <Input type="date" className="text-sm h-8" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input type="date" className="text-sm h-8" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Jornadas</p>
          <p className="text-2xl font-bold">{totalDias}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Horas extra</p>
          <p className="text-2xl font-bold">{totalHE.toFixed(1)}h</p>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Total bruto</p>
          <p className="text-2xl font-bold text-primary">RD$ {totalBruto.toLocaleString()}</p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <FileText className="w-4 h-4 mr-1.5" /> PDF
        </Button>
      </div>

      {/* Table by tecnico */}
      {byTecnico.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          No hay datos con los filtros seleccionados
        </div>
      ) : (
        <div className="space-y-4">
          {byTecnico.map(({ tecnico, jornadas: tj }) => {
            const subtotal = tj.reduce((s, j) => s + (j.totalJornada || 0), 0);
            return (
              <div key={tecnico?.id} className="bg-white border rounded-xl overflow-hidden">
                <div className="bg-muted/40 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {tecnico?.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{tecnico?.nombre ?? '—'}</span>
                    <span className="text-xs text-muted-foreground ml-1">{tj.length} jornadas</span>
                  </div>
                  <span className="font-bold text-primary">RD$ {subtotal.toLocaleString()}</span>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b">
                      <th className="text-left px-4 py-2">Fecha</th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">Proyecto</th>
                      <th className="text-left px-4 py-2 hidden md:table-cell">Tipo</th>
                      <th className="text-right px-4 py-2">Total</th>
                      <th className="text-left px-4 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tj.map(j => (
                      <tr key={j.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2">{new Date(j.fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground truncate max-w-[180px]">{j.project?.nombre}</td>
                        <td className="px-4 py-2 hidden md:table-cell capitalize">{j.tipoJornada}</td>
                        <td className="px-4 py-2 text-right font-semibold">RD$ {(j.totalJornada || 0).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{j.estado}</span>
                          {j.periodoPagoId && <span className="ml-1 text-emerald-600">✓</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
