'use client';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

const ESTADO_DOT: Record<string, string> = {
  programado: 'bg-blue-400',
  presente: 'bg-emerald-500',
  ausente: 'bg-red-400',
  cancelado: 'bg-gray-400',
  pendiente: 'bg-amber-400',
  aprobado: 'bg-teal-500',
};

interface Props {
  jornadas: any[];
  tecnicos: any[];
  onRefresh: () => void;
  onNewJornada: () => void;
}

export default function CalendarioView({ jornadas, tecnicos, onRefresh, onNewJornada }: Props) {
  const [current, setCurrent] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [filterTecnico, setFilterTecnico] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Assign color per project
  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    for (const j of jornadas) {
      if (j.projectId && !map[j.projectId]) map[j.projectId] = PROJECT_COLORS[idx++ % PROJECT_COLORS.length];
    }
    return map;
  }, [jornadas]);

  const filteredJornadas = useMemo(() =>
    filterTecnico ? jornadas.filter(j => j.tecnicoId === filterTecnico) : jornadas,
  [jornadas, filterTecnico]);

  // Build calendar days
  const firstDay = new Date(current.year, current.month, 1);
  const lastDay = new Date(current.year, current.month + 1, 0);
  const startOffset = firstDay.getDay(); // 0 = Sunday
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const days: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startOffset + 1;
    if (d < 1 || d > lastDay.getDate()) return null;
    return new Date(current.year, current.month, d);
  });

  const getJornadasForDay = (date: Date) => {
    const key = date.toISOString().split('T')[0];
    return filteredJornadas.filter(j => {
      const start = j.fecha?.split('T')[0];
      const end = j.fechaFin ? j.fechaFin.split('T')[0] : start;
      return key >= start && key <= end;
    });
  };

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  const today = () => { const d = new Date(); setCurrent({ year: d.getFullYear(), month: d.getMonth() }); };

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedJornadas = selectedDay ? filteredJornadas.filter(j => {
    const start = j.fecha?.split('T')[0];
    const end = j.fechaFin ? j.fechaFin.split('T')[0] : start;
    return selectedDay >= start && selectedDay <= end;
  }) : [];

  // Detect conflicts: same tecnico + overlapping date ranges
  const conflicts = useMemo(() => {
    const conflictIds = new Set<string>();
    for (let i = 0; i < filteredJornadas.length; i++) {
      const a = filteredJornadas[i];
      const aStart = a.fecha?.split('T')[0];
      const aEnd = a.fechaFin ? a.fechaFin.split('T')[0] : aStart;
      for (let k = i + 1; k < filteredJornadas.length; k++) {
        const b = filteredJornadas[k];
        if (a.tecnicoId !== b.tecnicoId) continue;
        const bStart = b.fecha?.split('T')[0];
        const bEnd = b.fechaFin ? b.fechaFin.split('T')[0] : bStart;
        if (aStart <= bEnd && aEnd >= bStart) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
    return Array.from(conflictIds);
  }, [filteredJornadas]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={today}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
          <h2 className="text-base font-semibold ml-2">{MONTHS[current.month]} {current.year}</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={filterTecnico}
            onChange={e => setFilterTecnico(e.target.value)}
          >
            <option value="">Todos los técnicos</option>
            {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <Button size="sm" onClick={onNewJornada}><Plus className="w-4 h-4 mr-1.5" />Jornada</Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-muted/40">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[80px] bg-muted/10" />;
            const dateStr = date.toISOString().split('T')[0];
            const dayJornadas = getJornadasForDay(date);
            const isToday = dateStr === todayStr;
            const isSelected = selectedDay === dateStr;
            const hasConflict = dayJornadas.some(j => conflicts.includes(j.id));

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`min-h-[80px] p-1.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/5 ring-inset ring-1 ring-primary' :
                  isToday ? 'bg-blue-50' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-primary text-white' : 'text-foreground'
                  }`}>{date.getDate()}</span>
                  {hasConflict && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                </div>
                <div className="space-y-0.5">
                  {dayJornadas.slice(0, 3).map(j => (
                    <div
                      key={j.id}
                      className="text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1"
                      style={{ backgroundColor: `${projectColorMap[j.projectId] ?? '#6B7280'}20`, color: projectColorMap[j.projectId] ?? '#6B7280' }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ESTADO_DOT[j.estado] ?? 'bg-gray-400'}`} />
                      {j.tecnico?.nombre?.split(' ')[0]}
                    </div>
                  ))}
                  {dayJornadas.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1">+{dayJornadas.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span className="text-xs text-muted-foreground">{selectedJornadas.length} jornada{selectedJornadas.length !== 1 ? 's' : ''}</span>
          </div>
          {selectedJornadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin jornadas este día.</p>
          ) : (
            <div className="space-y-2">
              {selectedJornadas.map(j => (
                <div key={j.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div
                    className="w-2 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: projectColorMap[j.projectId] ?? '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{j.tecnico?.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{j.project?.nombre} — {j.project?.cliente}</p>
                    {j.horaEntrada && <p className="text-xs text-muted-foreground">{j.horaEntrada} — {j.horaSalida}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">RD$ {(j.totalJornada || 0).toLocaleString()}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ESTADO_DOT[j.estado] ? 'text-white' : ''}`}
                      style={{ backgroundColor: j.estado === 'aprobado' ? '#0D9488' : j.estado === 'pendiente' ? '#F59E0B' : undefined }}
                    >
                      {j.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
