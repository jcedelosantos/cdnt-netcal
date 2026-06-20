'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Users, CalendarDays, DollarSign, BarChart3, Plus, Search,
  HardHat, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  ChevronRight, Loader2, Filter, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TecnicoForm from './_components/tecnico-form';
import JornadaForm from './_components/jornada-form';
import CalendarioView from './_components/calendario-view';
import PagosDashboard from './_components/pagos-dashboard';
import ReporteTecnicos from './_components/reporte-tecnicos';

type Tab = 'dashboard' | 'tecnicos' | 'jornadas' | 'calendario' | 'pagos' | 'reportes';

const TABS = [
  { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
  { id: 'tecnicos' as Tab, label: 'Técnicos', icon: Users },
  { id: 'jornadas' as Tab, label: 'Jornadas', icon: CalendarDays },
  { id: 'calendario' as Tab, label: 'Calendario', icon: CalendarDays },
  { id: 'pagos' as Tab, label: 'Pagos', icon: DollarSign },
  { id: 'reportes' as Tab, label: 'Reportes', icon: BarChart3 },
];

const ESTADO_COLORS: Record<string, string> = {
  activo: 'bg-emerald-100 text-emerald-800',
  inactivo: 'bg-gray-100 text-gray-700',
  suspendido: 'bg-red-100 text-red-800',
};

const TIPO_LABELS: Record<string, string> = {
  fijo: 'Fijo',
  temporal: 'Temporal',
  subcontratista: 'Subcontratista',
  ayudante: 'Ayudante',
  supervisor: 'Supervisor',
};

export default function TecnicosPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showTecnicoForm, setShowTecnicoForm] = useState(false);
  const [showJornadaForm, setShowJornadaForm] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<any>(null);
  const [editingJornada, setEditingJornada] = useState<any>(null);
  const [copyingJornada, setCopyingJornada] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, jRes, pRes] = await Promise.all([
        fetch('/api/tecnicos'),
        fetch('/api/jornadas'),
        fetch('/api/projects'),
      ]);
      if (tRes.ok) setTecnicos(await tRes.json());
      if (jRes.ok) setJornadas(await jRes.json());
      if (pRes.ok) { const pData = await pRes.json(); setProyectos(Array.isArray(pData) ? pData : (pData.data ?? [])); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredTecnicos = tecnicos.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.cedula?.toLowerCase().includes(search.toLowerCase()) ||
    t.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  // Dashboard KPIs
  const activos = tecnicos.filter(t => t.estado === 'activo').length;
  const hoy = new Date().toISOString().split('T')[0];
  const trabajandoHoy = jornadas.filter(j => j.fecha?.startsWith(hoy) && j.estado !== 'ausente' && j.estado !== 'cancelado').length;
  const pendientesAprobacion = jornadas.filter(j => j.estado === 'pendiente').length;
  const semanaInicio = new Date();
  semanaInicio.setDate(semanaInicio.getDate() - semanaInicio.getDay());
  const nominaSemana = jornadas
    .filter(j => new Date(j.fecha) >= semanaInicio && j.periodoPagoId === null)
    .reduce((s, j) => s + (j.totalJornada || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HardHat className="w-7 h-7 text-primary" />
            Gestión de Técnicos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Jornadas, pagos y reportes del personal técnico</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowJornadaForm(true); }}>
            <Clock className="w-4 h-4 mr-1.5" /> Registrar Jornada
          </Button>
          <Button size="sm" onClick={() => { setEditingTecnico(null); setShowTecnicoForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Técnico
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* DASHBOARD TAB */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Técnicos activos" value={activos} icon={Users} color="blue" />
                <KpiCard label="Trabajando hoy" value={trabajandoHoy} icon={CheckCircle2} color="emerald" />
                <KpiCard label="Jornadas pendientes" value={pendientesAprobacion} icon={AlertTriangle} color="amber" />
                <KpiCard label="Nómina sem. (sin pagar)" value={`RD$ ${nominaSemana.toLocaleString()}`} icon={DollarSign} color="violet" />
              </div>

              {/* Recent jornadas */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Jornadas recientes</h3>
                  <Button variant="ghost" size="sm" onClick={() => setTab('jornadas')}>
                    Ver todas <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <JornadasTable
                  jornadas={jornadas.slice(0, 8)}
                  onRefresh={loadData}
                  showActions={false}
                  onEdit={() => {}}
                  onCopy={() => {}}
                />
              </div>

              {/* Technician summary */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Técnicos activos</h3>
                  <Button variant="ghost" size="sm" onClick={() => setTab('tecnicos')}>
                    Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tecnicos.filter(t => t.estado === 'activo').slice(0, 6).map(t => {
                    const tjornadas = jornadas.filter(j => j.tecnicoId === t.id && !j.periodoPagoId);
                    const pendiente = tjornadas.reduce((s, j) => s + (j.totalJornada || 0), 0);
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => { setEditingTecnico(t); setShowTecnicoForm(true); }}>
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {t.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.nombre}</p>
                          <p className="text-xs text-muted-foreground">{t.rol?.nombre ?? t.tipoContratacion}</p>
                        </div>
                        <div className="ml-auto text-right shrink-0">
                          <p className="text-xs font-semibold text-emerald-700">RD$ {pendiente.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">pendiente</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TÉCNICOS TAB */}
          {tab === 'tecnicos' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar técnico..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Técnico</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Cédula</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Tipo</th>
                      <th className="text-right px-4 py-3 hidden md:table-cell">Tarifa/día</th>
                      <th className="text-left px-4 py-3">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTecnicos.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No hay técnicos registrados</td></tr>
                    )}
                    {filteredTecnicos.map(t => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {t.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{t.nombre}</p>
                              {t.codigo && <p className="text-xs text-muted-foreground">{t.codigo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.cedula ?? '—'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{t.rol?.nombre ?? TIPO_LABELS[t.tipoContratacion] ?? t.tipoContratacion}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell font-medium">RD$ {(t.tarifaDiaria || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[t.estado] ?? 'bg-muted text-foreground'}`}>
                            {t.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingTecnico(t); setShowTecnicoForm(true); }}>
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* JORNADAS TAB */}
          {tab === 'jornadas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold">Registro de Jornadas</h3>
                <Button size="sm" onClick={() => { setEditingJornada(null); setCopyingJornada(null); setShowJornadaForm(true); }}>
                  <Plus className="w-4 h-4 mr-1.5" /> Nueva Jornada
                </Button>
              </div>
              <div className="bg-white rounded-xl border overflow-x-auto">
                <JornadasTable
                  jornadas={jornadas}
                  onRefresh={loadData}
                  showActions
                  onEdit={j => { setEditingJornada(j); setCopyingJornada(null); setShowJornadaForm(true); }}
                  onCopy={j => { setCopyingJornada(j); setEditingJornada(null); setShowJornadaForm(true); }}
                />
              </div>
            </div>
          )}

          {/* CALENDARIO TAB */}
          {tab === 'calendario' && (
            <CalendarioView jornadas={jornadas} tecnicos={tecnicos} onRefresh={loadData} onNewJornada={() => setShowJornadaForm(true)} />
          )}

          {/* PAGOS TAB */}
          {tab === 'pagos' && (
            <PagosDashboard tecnicos={tecnicos} jornadas={jornadas} onRefresh={loadData} />
          )}

          {/* REPORTES TAB */}
          {tab === 'reportes' && (
            <ReporteTecnicos tecnicos={tecnicos} jornadas={jornadas} proyectos={proyectos} />
          )}
        </>
      )}

      {/* Modals */}
      {showTecnicoForm && (
        <TecnicoForm
          tecnico={editingTecnico}
          onClose={() => { setShowTecnicoForm(false); setEditingTecnico(null); }}
          onSaved={() => { setShowTecnicoForm(false); setEditingTecnico(null); loadData(); }}
        />
      )}
      {showJornadaForm && (
        <JornadaForm
          tecnicos={tecnicos.filter(t => t.estado === 'activo')}
          proyectos={proyectos}
          editando={editingJornada}
          copiando={copyingJornada}
          onClose={() => { setShowJornadaForm(false); setEditingJornada(null); setCopyingJornada(null); }}
          onSaved={() => { setShowJornadaForm(false); setEditingJornada(null); setCopyingJornada(null); loadData(); }}
        />
      )}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Jornadas Table ──────────────────────────────────────────────────────────
const ESTADO_JORNADA: Record<string, { label: string; cls: string }> = {
  programado: { label: 'Programado', cls: 'bg-blue-100 text-blue-800' },
  presente: { label: 'Presente', cls: 'bg-emerald-100 text-emerald-800' },
  ausente: { label: 'Ausente', cls: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-700' },
  pendiente: { label: 'Pend. aprob.', cls: 'bg-amber-100 text-amber-800' },
  aprobado: { label: 'Aprobado', cls: 'bg-teal-100 text-teal-800' },
};

function JornadasTable({
  jornadas, onRefresh, showActions, onEdit, onCopy,
}: {
  jornadas: any[];
  onRefresh: () => void;
  showActions: boolean;
  onEdit: (j: any) => void;
  onCopy: (j: any) => void;
}) {
  const aprobar = async (id: string) => {
    await fetch(`/api/jornadas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'aprobado' }) });
    onRefresh();
  };

  if (jornadas.length === 0) {
    return <p className="text-center py-12 text-muted-foreground text-sm">No hay jornadas registradas</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
        <tr>
          <th className="text-left px-4 py-3">Fecha</th>
          <th className="text-left px-4 py-3">Técnico</th>
          <th className="text-left px-4 py-3 hidden md:table-cell">Proyecto</th>
          <th className="text-left px-4 py-3 hidden lg:table-cell">Tipo</th>
          <th className="text-right px-4 py-3">Total</th>
          <th className="text-left px-4 py-3">Estado</th>
          {showActions && <th className="px-4 py-3 w-[120px]"></th>}
        </tr>
      </thead>
      <tbody className="divide-y">
        {jornadas.map(j => {
          const estado = ESTADO_JORNADA[j.estado] ?? { label: j.estado, cls: 'bg-muted text-foreground' };
          const pagada = !!j.periodoPagoId;
          return (
            <tr key={j.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-medium">
                <p>{new Date(j.fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</p>
                {j.fechaFin && j.fechaFin.split('T')[0] !== j.fecha.split('T')[0] ? (
                  <span className="text-[10px] text-muted-foreground">
                    → {new Date(j.fechaFin).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                    {' '}
                    <span className="font-medium text-primary">({j.diasTrabajados}d)</span>
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">{j.tecnico?.nombre ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-[180px]">{j.project?.nombre ?? '—'}</td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{j.tipoJornada?.replace('_', ' ')}</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold">RD$ {(j.totalJornada || 0).toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estado.cls}`}>{estado.label}</span>
                {pagada && <span className="ml-1 text-[10px] text-emerald-600">✓ pagado</span>}
              </td>
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {j.estado === 'pendiente' && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => aprobar(j.id)}>
                        Aprobar
                      </Button>
                    )}
                    {!pagada && (
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => onEdit(j)} title="Editar jornada">
                        ✏️
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => onCopy(j)} title="Copiar jornada">
                      📋
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
