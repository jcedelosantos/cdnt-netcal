'use client';
import { useState, useEffect } from 'react';
import { Plus, Loader2, DollarSign, CheckCircle2, Clock, AlertTriangle, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const loadPeriodos = async () => {
    const [pRes, aRes] = await Promise.all([
      fetch('/api/periodos-pago'),
      fetch('/api/anticipos'),
    ]);
    if (pRes.ok) setPeriodos(await pRes.json());
    if (aRes.ok) setAnticipos(await aRes.json());
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

  const exportPDF = async (p: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Header
    doc.setFontSize(16);
    doc.setTextColor(21, 100, 175);
    doc.text('Comprobante de Pago — Nómina', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Período: ${p.nombre}`, 14, 27);
    doc.text(`Fechas: ${new Date(p.fechaInicio).toLocaleDateString('es-DO')} — ${new Date(p.fechaFin).toLocaleDateString('es-DO')}`, 14, 33);
    doc.text(`Estado: ${p.estado.toUpperCase()}`, 14, 39);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 45);

    // Separator line
    doc.setDrawColor(21, 100, 175);
    doc.setLineWidth(0.5);
    doc.line(14, 50, 196, 50);

    // Detail table per technician
    if (p.detalles && p.detalles.length > 0) {
      const rows = p.detalles.map((d: any) => {
        const tec = tecnicos.find((t: any) => t.id === d.tecnicoId);
        const jornadasTec = jornadas.filter((j: any) => j.tecnicoId === d.tecnicoId && j.periodoPagoId === p.id);
        const starts = jornadasTec.map((j: any) => j.fecha?.split('T')[0]).sort();
        const ends = jornadasTec.map((j: any) => (j.fechaFin ? j.fechaFin.split('T')[0] : j.fecha?.split('T')[0])).sort();
        const rango = starts.length > 0
          ? `${new Date(starts[0] + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })} → ${new Date(ends[ends.length - 1] + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}`
          : '—';
        return [
          tec?.nombre ?? d.tecnicoId,
          rango,
          d.diasTrabajados,
          `RD$ ${(d.pagoBruto || 0).toLocaleString()}`,
          d.anticipos > 0 ? `- RD$ ${d.anticipos.toLocaleString()}` : '—',
          d.descuentos > 0 ? `- RD$ ${d.descuentos.toLocaleString()}` : '—',
          `RD$ ${(d.pagoNeto || 0).toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: 56,
        head: [['Técnico', 'Período', 'Días', 'Bruto', 'Anticipos', 'Descuentos', 'Neto']],
        body: rows,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [21, 100, 175], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 32 },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 28, halign: 'right' },
          6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
      });

      // Totals summary
      const finalY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`Total bruto:`, 120, finalY);
      doc.text(`RD$ ${(p.totalBruto || 0).toLocaleString()}`, 196, finalY, { align: 'right' });
      if (p.totalAnticipos > 0) {
        doc.text(`Anticipos aplicados:`, 120, finalY + 6);
        doc.text(`- RD$ ${(p.totalAnticipos || 0).toLocaleString()}`, 196, finalY + 6, { align: 'right' });
      }
      doc.setFontSize(12);
      doc.setTextColor(21, 100, 175);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total neto:`, 120, finalY + 14);
      doc.text(`RD$ ${(p.totalNeto || 0).toLocaleString()}`, 196, finalY + 14, { align: 'right' });
    }

    const filename = `nomina-${p.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    doc.save(filename);
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
                      {new Date(p.fechaInicio).toLocaleDateString('es-DO')} — {new Date(p.fechaFin).toLocaleDateString('es-DO')} · {p._count?.jornadas ?? 0} jornadas
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
                        const ini = new Date(starts[0] + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
                        const fin = new Date(ends[ends.length - 1] + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
                        return ini === fin ? ini : `${ini} → ${fin}`;
                      })() : null;
                      return (
                        <div key={d.id} className="text-xs bg-muted/40 rounded-lg p-2">
                          <p className="font-medium truncate">{tec?.nombre ?? d.tecnicoId}</p>
                          {fechasRango && <p className="text-primary/80 font-medium">{fechasRango}</p>}
                          <p className="text-muted-foreground">{d.diasTrabajados}d · RD$ {d.pagoNeto.toLocaleString()}</p>
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
