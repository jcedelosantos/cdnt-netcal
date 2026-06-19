'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, Calculator } from 'lucide-react';
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

interface Props {
  tecnicos: any[];
  proyectos: any[];
  onClose: () => void;
  onSaved: () => void;
  preselect?: { tecnicoId?: string; projectId?: string; fecha?: string };
  editando?: any;   // jornada completa para editar
  copiando?: any;   // jornada completa para copiar (mismos datos, fecha vacía)
}

export default function JornadaForm({ tecnicos, proyectos, onClose, onSaved, preselect, editando, copiando }: Props) {
  const source = editando ?? copiando;
  const modoEdicion = !!editando;
  const modoCopia = !!copiando;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildInitialForm = () => {
    if (source) {
      return {
        tecnicoId: source.tecnicoId ?? '',
        projectId: source.projectId ?? '',
        // Editar: misma fecha. Copiar: vacío para que el usuario elija
        fecha: modoEdicion
          ? (source.fecha ? source.fecha.split('T')[0] : '')
          : new Date().toISOString().split('T')[0],
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
    return {
      tecnicoId: preselect?.tecnicoId ?? '',
      projectId: preselect?.projectId ?? '',
      fecha: preselect?.fecha ?? new Date().toISOString().split('T')[0],
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

  // Auto-fill tarifa when tecnico changes (solo si no hay valor ya)
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

  const calcTotal = () => {
    const tarifa = parseFloat(form.tarifaDia) || 0;
    const tipo = TIPOS_JORNADA.find(t => t.value === form.tipoJornada);
    let base = tarifa;
    if (tipo?.mult !== null && tipo?.mult !== undefined) base = tarifa * tipo.mult;
    else base = (parseFloat(form.horasTotales) || 0) * (tarifa / 8 || 0);

    const extras = (parseFloat(form.horasExtra) || 0) * (parseFloat(form.tarifaHoraExtra) || 0);
    const total = base + extras + (parseFloat(form.bonificacion) || 0) + (parseFloat(form.viaticos) || 0) +
      (parseFloat(form.transporte) || 0) + (parseFloat(form.alimentacion) || 0) - (parseFloat(form.descuento) || 0);
    return Math.max(0, total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.tecnicoId || !form.projectId || !form.fecha) { setError('Técnico, proyecto y fecha son requeridos'); return; }
    setLoading(true);
    try {
      const url = modoEdicion ? `/api/jornadas/${editando.id}` : '/api/jornadas';
      const method = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalJornada: calcTotal() }),
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

          {/* Técnico, Proyecto, Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
            </div>
          </div>

          {/* Horario y tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label>Entrada</Label>
              <Input type="time" value={form.horaEntrada} onChange={e => set('horaEntrada', e.target.value)} />
            </div>
            <div>
              <Label>Salida</Label>
              <Input type="time" value={form.horaSalida} onChange={e => set('horaSalida', e.target.value)} />
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
            <Calculator className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total calculado esta jornada</p>
              <p className="text-2xl font-bold text-primary">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
            </div>
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
