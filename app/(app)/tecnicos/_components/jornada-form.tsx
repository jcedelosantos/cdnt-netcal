'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TIPOS_JORNADA = [
  { value: 'completa', label: 'Jornada completa', mult: 1 },
  { value: 'media', label: 'Media jornada', mult: 0.5 },
  { value: 'horas', label: 'Por horas', mult: null },
  { value: 'nocturna', label: 'Trabajo nocturno', mult: 1.35 },
  { value: 'fin_semana', label: 'Fin de semana', mult: 1.5 },
  { value: 'feriado', label: 'Día feriado', mult: 2 },
];

const ESTADOS_JORNADA = ['programado', 'presente', 'ausente', 'cancelado', 'pendiente', 'aprobado'];
const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function calcDiasBetween(ini: string, fin: string): number {
  if (!ini || !fin) return 1;
  const d1 = new Date(ini + 'T12:00:00');
  const d2 = new Date(fin + 'T12:00:00');
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
}

// ─── Mini-calendario de días individuales ────────────────────────────────────
function IndividualCalendar({ selected, onChange }: {
  selected: string[];
  onChange: (dates: string[]) => void;
}) {
  const seed = selected[0] ? new Date(selected[0] + 'T12:00:00') : new Date();
  const [mes, setMes] = useState({ year: seed.getFullYear(), month: seed.getMonth() });

  const firstDay = new Date(mes.year, mes.month, 1);
  const lastDay = new Date(mes.year, mes.month + 1, 0);
  const offset = firstDay.getDay();
  const cells = Math.ceil((offset + lastDay.getDate()) / 7) * 7;
  const days: (Date | null)[] = Array.from({ length: cells }, (_, i) => {
    const d = i - offset + 1;
    return d < 1 || d > lastDay.getDate() ? null : new Date(mes.year, mes.month, d);
  });

  const prev = () => setMes(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 });
  const next = () => setMes(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 });
  const todayStr = new Date().toISOString().split('T')[0];

  const toggle = (date: Date) => {
    const str = date.toISOString().split('T')[0];
    const next = selected.includes(str) ? selected.filter(d => d !== str) : [...selected, str].sort();
    onChange(next);
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-muted/30 px-3 py-2">
        <button type="button" onClick={prev} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold">{MONTHS[mes.month]} {mes.year}</span>
        <button type="button" onClick={next} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="p-3 space-y-1">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => <span key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">{d}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="h-8" />;
            const str = date.toISOString().split('T')[0];
            const isSel = selected.includes(str);
            const isToday = str === todayStr;
            return (
              <div
                key={i}
                onClick={() => toggle(date)}
                className={`h-8 text-xs flex items-center justify-center cursor-pointer rounded-lg transition-colors select-none ${
                  isSel ? 'bg-primary text-white font-bold' :
                  isToday ? 'font-bold ring-1 ring-inset ring-primary/40 hover:bg-muted' :
                  'hover:bg-muted'
                }`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-2 border-t text-xs mt-1">
          <span className="text-muted-foreground italic">Click para seleccionar/deseleccionar</span>
          {selected.length > 0 && (
            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selected.length} día{selected.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mini-calendario de rango ────────────────────────────────────────────────
function RangoCalendar({ inicio, fin, onChange }: {
  inicio: string;
  fin: string;
  onChange: (ini: string, fin: string) => void;
}) {
  const seed = inicio ? new Date(inicio + 'T12:00:00') : new Date();
  const [mes, setMes] = useState({ year: seed.getFullYear(), month: seed.getMonth() });
  // fase: 'inicio' = esperando primer click, 'fin' = esperando segundo click
  const [fase, setFase] = useState<'inicio' | 'fin'>(inicio ? 'fin' : 'inicio');
  const [hover, setHover] = useState<string | null>(null);

  const firstDay = new Date(mes.year, mes.month, 1);
  const lastDay = new Date(mes.year, mes.month + 1, 0);
  const offset = firstDay.getDay();
  const cells = Math.ceil((offset + lastDay.getDate()) / 7) * 7;
  const days: (Date | null)[] = Array.from({ length: cells }, (_, i) => {
    const d = i - offset + 1;
    return d < 1 || d > lastDay.getDate() ? null : new Date(mes.year, mes.month, d);
  });

  const prev = () => setMes(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 });
  const next = () => setMes(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 });
  const todayStr = new Date().toISOString().split('T')[0];

  const handleClick = (date: Date) => {
    const str = date.toISOString().split('T')[0];
    if (fase === 'inicio') {
      onChange(str, str);
      setFase('fin');
    } else {
      if (str < inicio) {
        onChange(str, str);
        setFase('fin');
      } else {
        onChange(inicio, str);
        setFase('inicio');
      }
    }
  };

  const dias = calcDiasBetween(inicio, fin);

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/30 px-3 py-2">
        <button type="button" onClick={prev} className="p-1 hover:bg-muted rounded-md transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{MONTHS[mes.month]} {mes.year}</span>
        <button type="button" onClick={next} className="p-1 hover:bg-muted rounded-md transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-1">
        {/* Días semana */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <span key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">{d}</span>
          ))}
        </div>

        {/* Grilla */}
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="h-8" />;
            const str = date.toISOString().split('T')[0];
            const isInicio = str === inicio;
            const isFin = str === fin;
            const previewFin = fase === 'fin' && hover && str === hover && str > inicio;
            const inRange = inicio && fin && str > inicio && str < fin;
            const inPreview = fase === 'fin' && hover && inicio && str > inicio && str < hover;
            const isToday = str === todayStr;

            let cls = 'h-8 text-xs flex items-center justify-center cursor-pointer transition-colors select-none ';
            if (isInicio || isFin) {
              cls += 'bg-primary text-white font-bold rounded-lg z-10 ';
            } else if (inRange) {
              cls += 'bg-primary/20 text-primary rounded-none ';
            } else if (inPreview) {
              cls += 'bg-primary/10 text-primary/80 rounded-none ';
            } else if (previewFin) {
              cls += 'bg-primary/15 text-primary rounded-lg ';
            } else {
              cls += `hover:bg-muted rounded-lg ${isToday ? 'font-bold ring-1 ring-inset ring-primary/40' : ''} `;
            }

            return (
              <div
                key={i}
                className={cls}
                onClick={() => handleClick(date)}
                onMouseEnter={() => setHover(str)}
                onMouseLeave={() => setHover(null)}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        {/* Info debajo */}
        <div className="flex items-center justify-between pt-2 border-t text-xs mt-1">
          <span className="text-muted-foreground italic">
            {fase === 'inicio' ? 'Selecciona el día de inicio' : 'Selecciona el día final'}
          </span>
          {dias > 1 && (
            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{dias} días</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Props del formulario ────────────────────────────────────────────────────
interface Props {
  tecnicos: any[];
  proyectos: any[];
  onClose: () => void;
  onSaved: () => void;
  preselect?: { tecnicoId?: string; projectId?: string; fecha?: string };
  editando?: any;
  copiando?: any;
}

export default function JornadaForm({ tecnicos, proyectos, onClose, onSaved, preselect, editando, copiando }: Props) {
  const source = editando ?? copiando;
  const modoEdicion = !!editando;
  const modoCopia = !!copiando;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modoIndividual, setModoIndividual] = useState(() => {
    return !!(source?.fechasIndividuales);
  });
  const [fechasIndividuales, setFechasIndividuales] = useState<string[]>(() => {
    if (source?.fechasIndividuales) {
      try { return JSON.parse(source.fechasIndividuales); } catch { return []; }
    }
    return [];
  });

  const buildInitialForm = () => {
    if (source) {
      const fechaInicio = modoEdicion
        ? (source.fecha ? source.fecha.split('T')[0] : '')
        : new Date().toISOString().split('T')[0];
      const fechaFin = source.fechaFin
        ? source.fechaFin.split('T')[0]
        : fechaInicio;
      return {
        tecnicoId: source.tecnicoId ?? '',
        projectId: source.projectId ?? '',
        fecha: fechaInicio,
        fechaFin,
        horaEntrada: source.horaEntrada ?? '08:00',
        horaSalida: source.horaSalida ?? '17:00',
        horasTotales: source.horasTotales?.toString() ?? '9',
        horasExtra: source.horasExtra?.toString() ?? '0',
        tipoJornada: source.tipoJornada ?? 'completa',
        tarifaDia: source.tarifaDia?.toString() ?? '',
        tarifaHoraExtra: source.tarifaHoraExtra?.toString() ?? '0',
        bonificacion: source.bonificacion?.toString() ?? '0',
        viaticos: source.viaticos?.toString() ?? '0',
        transporte: source.transporte?.toString() ?? '0',
        alimentacion: source.alimentacion?.toString() ?? '0',
        descuento: source.descuento?.toString() ?? '0',
        actividades: source.actividades ?? '',
        observaciones: source.observaciones ?? '',
        estado: modoEdicion ? (source.estado ?? 'presente') : 'presente',
      };
    }
    const hoy = preselect?.fecha ?? new Date().toISOString().split('T')[0];
    return {
      tecnicoId: preselect?.tecnicoId ?? '',
      projectId: preselect?.projectId ?? '',
      fecha: hoy,
      fechaFin: hoy,
      horaEntrada: '08:00',
      horaSalida: '17:00',
      horasTotales: '9',
      horasExtra: '0',
      tipoJornada: 'completa',
      tarifaDia: '',
      tarifaHoraExtra: '',
      bonificacion: '0',
      viaticos: '0',
      transporte: '0',
      alimentacion: '0',
      descuento: '0',
      actividades: '',
      observaciones: '',
      estado: 'presente',
    };
  };

  const [form, setForm] = useState(buildInitialForm);

  // Apply initial hour calculation on mount
  useEffect(() => {
    const initial = buildInitialForm();
    if (initial.horaEntrada && initial.horaSalida) {
      recalcHoras(initial.horaEntrada, initial.horaSalida);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.tecnicoId && !source) {
      const t = tecnicos.find(tc => tc.id === form.tecnicoId);
      if (t) {
        setForm(f => ({
          ...f,
          tarifaDia: t.tarifaDiaria?.toString() ?? '0',
          tarifaHoraExtra: t.tarifaHoraExtra?.toString() ?? '0',
        }));
      }
    }
  }, [form.tecnicoId, tecnicos, source]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const recalcHoras = (entrada: string, salida: string) => {
    if (!entrada || !salida) return;
    const [eh, em] = entrada.split(':').map(Number);
    const [sh, sm] = salida.split(':').map(Number);
    if (isNaN(eh) || isNaN(sh)) return;
    const totalMins = (sh * 60 + sm) - (eh * 60 + em);
    if (totalMins <= 0) return;
    const totalH = totalMins / 60;
    const extra = Math.max(0, totalH - 9);
    const tipo = totalH <= 4.5 ? 'media' : 'completa';
    setForm(f => ({
      ...f,
      horaEntrada: entrada,
      horaSalida: salida,
      horasTotales: parseFloat(totalH.toFixed(2)).toString(),
      horasExtra: extra > 0 ? parseFloat(extra.toFixed(2)).toString() : '0',
      tipoJornada: tipo,
    }));
  };

  const diasTrabajados = modoIndividual
    ? Math.max(1, fechasIndividuales.length)
    : calcDiasBetween(form.fecha, form.fechaFin);

  const calcTotal = () => {
    const tarifa = parseFloat(form.tarifaDia) || 0;
    const tipo = TIPOS_JORNADA.find(t => t.value === form.tipoJornada);
    let tarifaPorDia = tarifa;
    if (tipo?.mult !== null && tipo?.mult !== undefined) tarifaPorDia = tarifa * tipo.mult;
    else tarifaPorDia = (parseFloat(form.horasTotales) || 0) * (tarifa / 8 || 0);

    const base = tarifaPorDia * diasTrabajados;
    const extras = (parseFloat(form.horasExtra) || 0) * (parseFloat(form.tarifaHoraExtra) || 0);
    return Math.max(0,
      base + extras +
      (parseFloat(form.bonificacion) || 0) +
      (parseFloat(form.viaticos) || 0) +
      (parseFloat(form.transporte) || 0) +
      (parseFloat(form.alimentacion) || 0) -
      (parseFloat(form.descuento) || 0)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.tecnicoId || !form.projectId) {
      setError('Técnico y proyecto son requeridos');
      return;
    }
    if (modoIndividual && fechasIndividuales.length === 0) {
      setError('Selecciona al menos un día');
      return;
    }
    if (!modoIndividual && !form.fecha) {
      setError('Fecha es requerida');
      return;
    }
    setLoading(true);

    // Derive fecha/fechaFin from individual dates when applicable
    const fechaBase = modoIndividual ? fechasIndividuales[0] : form.fecha;
    const fechaFinBase = modoIndividual ? fechasIndividuales[fechasIndividuales.length - 1] : form.fechaFin;

    try {
      const url = modoEdicion ? `/api/jornadas/${editando.id}` : '/api/jornadas';
      const method = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fecha: fechaBase,
          fechaFin: fechaFinBase,
          diasTrabajados,
          totalJornada: calcTotal(),
          fechasIndividuales: modoIndividual ? JSON.stringify(fechasIndividuales) : null,
        }),
      });
      if (res.status === 409) { setError('Ya existe una jornada para este técnico, proyecto y fecha'); return; }
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error al guardar'); return; }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const total = calcTotal();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">
            {modoEdicion ? 'Editar Jornada' : modoCopia ? 'Copiar Jornada' : 'Registrar Jornada'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          {/* Técnico y Proyecto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Técnico *</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tecnicoId} onChange={e => set('tecnicoId', e.target.value)} required>
                <option value="">Seleccionar...</option>
                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label>Proyecto *</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.projectId} onChange={e => set('projectId', e.target.value)} required>
                <option value="">Seleccionar...</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.cliente ? ` — ${p.cliente}` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Período de trabajo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Período de trabajo *</Label>
              {/* Toggle rango / días individuales */}
              <div className="flex items-center bg-muted rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setModoIndividual(false)}
                  className={`px-3 py-1 rounded-md transition-colors font-medium ${!modoIndividual ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Rango
                </button>
                <button
                  type="button"
                  onClick={() => setModoIndividual(true)}
                  className={`px-3 py-1 rounded-md transition-colors font-medium ${modoIndividual ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Días sueltos
                </button>
              </div>
            </div>

            {modoIndividual ? (
              <>
                {fechasIndividuales.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {fechasIndividuales.map(d => (
                      <span key={d} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {new Date(d + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                      </span>
                    ))}
                  </div>
                )}
                <IndividualCalendar
                  selected={fechasIndividuales}
                  onChange={setFechasIndividuales}
                />
              </>
            ) : (
              <>
                {diasTrabajados > 1 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {new Date(form.fecha + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                    {' → '}
                    {new Date(form.fechaFin + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                  </div>
                )}
                <RangoCalendar
                  inicio={form.fecha}
                  fin={form.fechaFin}
                  onChange={(ini, fin) => setForm(f => ({ ...f, fecha: ini, fechaFin: fin }))}
                />
              </>
            )}
          </div>

          {/* Horario y tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label>Entrada</Label>
              <Input type="time" value={form.horaEntrada} onChange={e => recalcHoras(e.target.value, form.horaSalida)} />
            </div>
            <div>
              <Label>Salida</Label>
              <Input type="time" value={form.horaSalida} onChange={e => recalcHoras(form.horaEntrada, e.target.value)} />
            </div>
            <div>
              <Label>Horas totales</Label>
              <Input type="number" min="0" step="0.5" value={form.horasTotales} onChange={e => set('horasTotales', e.target.value)} />
            </div>
            <div>
              <Label>Horas extra</Label>
              <Input type="number" min="0" step="0.5" value={form.horasExtra} onChange={e => set('horasExtra', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de jornada</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tipoJornada} onChange={e => set('tipoJornada', e.target.value)}>
                {TIPOS_JORNADA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Estado</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.estado} onChange={e => set('estado', e.target.value)}>
                {ESTADOS_JORNADA.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Tarifas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label>Tarifa del día (RD$)</Label>
              <Input type="number" min="0" value={form.tarifaDia} onChange={e => set('tarifaDia', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Tarifa hora extra</Label>
              <Input type="number" min="0" value={form.tarifaHoraExtra} onChange={e => set('tarifaHoraExtra', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Bonificación</Label>
              <Input type="number" min="0" value={form.bonificacion} onChange={e => set('bonificacion', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Viáticos</Label>
              <Input type="number" min="0" value={form.viaticos} onChange={e => set('viaticos', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Transporte</Label>
              <Input type="number" min="0" value={form.transporte} onChange={e => set('transporte', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Descuento</Label>
              <Input type="number" min="0" value={form.descuento} onChange={e => set('descuento', e.target.value)} placeholder="0" />
            </div>
          </div>

          <div>
            <Label>Actividades realizadas</Label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm resize-none" rows={2} value={form.actividades} onChange={e => set('actividades', e.target.value)} placeholder="Descripción del trabajo..." />
          </div>

          {/* Total preview */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <Calculator className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total calculado</p>
              <p className="text-2xl font-bold text-primary">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
            </div>
            {diasTrabajados > 1 && (
              <div className="text-right text-xs text-muted-foreground shrink-0">
                <p>{diasTrabajados} días × RD$ {(parseFloat(form.tarifaDia) || 0).toLocaleString()}</p>
                <p>= RD$ {(diasTrabajados * (parseFloat(form.tarifaDia) || 0)).toLocaleString()} base</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Guardar jornada
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
