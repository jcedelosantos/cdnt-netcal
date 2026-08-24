'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';

interface ROIProject {
  id: string;
  nombre: string;
  cliente?: string;
  estado: string;
  revenue: number;
  laborCost: number;
  costoEstimado: number;
  costs: number;
  profit: number;
  roiPercent: number;
  marginPercent: number;
  daysActive: number;
  jornadasCount: number;
  createdAt: string;
}

interface ROISummary {
  totalProjects: number;
  totalRevenue: number;
  totalLaborCost: number;
  totalCosts: number;
  totalProfit: number;
  avgRoi: number;
  avgMargin: number;
  profitableProjects: number;
  lossProjects: number;
}

export default function ROIPage() {
  const [projects, setProjects] = useState<ROIProject[]>([]);
  const [summary, setSummary] = useState<ROISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'profitable' | 'loss'>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'revenue' | 'profit' | 'labor'>('roi');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchROI(); }, []);

  const fetchROI = async () => {
    try {
      const res = await fetch('/api/roi-analysis');
      const data = await res.json();
      setProjects(data.projects || []);
      setSummary(data.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(v);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'profitable') return p.profit > 0;
    if (filter === 'loss') return p.profit <= 0;
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'roi') return b.roiPercent - a.roiPercent;
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'labor') return b.laborCost - a.laborCost;
    return b.profit - a.profit;
  });

  const marginColor = (m: number) =>
    m >= 40 ? 'text-emerald-600' : m >= 20 ? 'text-amber-600' : m >= 0 ? 'text-orange-600' : 'text-red-600';

  const marginBg = (m: number) =>
    m >= 40 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    m >= 20 ? 'bg-amber-50 text-amber-700 border-amber-200' :
    m >= 0  ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="space-y-6 max-w-[1400px]">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Análisis de ROI</h1>
          <p className="text-gray-500 mt-2">Rentabilidad real por proyecto: ingresos vs costos de mano de obra técnica</p>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-50 rounded-lg"><DollarSign className="w-4 h-4 text-blue-600" /></div>
                <p className="text-xs text-gray-500 font-medium">Ingresos Totales</p>
              </div>
              <p className="text-2xl font-bold">{fmt(summary?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-400 mt-1">{summary?.totalProjects || 0} proyectos</p>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-50 rounded-lg"><Wrench className="w-4 h-4 text-red-500" /></div>
                <p className="text-xs text-gray-500 font-medium">Costo Técnicos</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{fmt(summary?.totalLaborCost || 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Pagos registrados</p>
            </CardContent>
          </Card>

          <Card className={summary?.totalProfit! > 0 ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${summary?.totalProfit! > 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {summary?.totalProfit! > 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                    : <TrendingDown className="w-4 h-4 text-red-600" />}
                </div>
                <p className={`text-xs font-medium ${summary?.totalProfit! > 0 ? 'text-emerald-600' : 'text-red-600'}`}>Ganancia Neta</p>
              </div>
              <p className={`text-2xl font-bold ${summary?.totalProfit! > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {fmt(summary?.totalProfit || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{summary?.profitableProjects} rentables · {summary?.lossProjects} pérdida</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/40">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
                <p className="text-xs text-blue-600 font-medium">ROI Promedio</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{summary?.avgRoi || 0}%</p>
              <p className="text-xs text-gray-400 mt-1">Margen {summary?.avgMargin || 0}%</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">Todos</Button>
          <Button variant={filter === 'profitable' ? 'default' : 'outline'} onClick={() => setFilter('profitable')} size="sm"
            className={filter === 'profitable' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
            Rentables
          </Button>
          <Button variant={filter === 'loss' ? 'default' : 'outline'} onClick={() => setFilter('loss')} size="sm"
            className={filter === 'loss' ? 'bg-red-600 hover:bg-red-700' : ''}>
            Pérdida
          </Button>
          <div className="flex-1" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
            <option value="roi">Ordenar: ROI %</option>
            <option value="revenue">Ordenar: Ingresos</option>
            <option value="labor">Ordenar: Costo técnicos</option>
            <option value="profit">Ordenar: Ganancia</option>
          </select>
        </div>
      </FadeIn>

      {/* Projects Table */}
      <FadeIn delay={0.3}>
        <Card>
          <CardContent className="pt-4 px-0">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Calculando...</div>
            ) : sortedProjects.length === 0 ? (
              <div className="text-center py-10 text-gray-400">Sin proyectos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Proyecto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Ingresos</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                        <span className="flex items-center justify-end gap-1"><Wrench className="w-3 h-3" />Costo técnicos</span>
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Ganancia</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Margen %</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">ROI %</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                        <span className="flex items-center justify-end gap-1"><Users className="w-3 h-3" />Jornadas</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.map((project) => (
                      <>
                        <tr
                          key={project.id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpanded(expanded === project.id ? null : project.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium">{project.nombre}</div>
                            {project.cliente && <div className="text-xs text-gray-400">{project.cliente}</div>}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">{fmt(project.revenue)}</td>
                          <td className="text-right py-3 px-4 text-red-600 font-medium">{fmt(project.laborCost)}</td>
                          <td className="text-right py-3 px-4">
                            <span className={project.profit >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {fmt(project.profit)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${marginBg(project.marginPercent)}`}>
                              {project.marginPercent}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={`flex items-center justify-end gap-1 font-medium ${marginColor(project.roiPercent)}`}>
                              {project.roiPercent > 0
                                ? <TrendingUp className="w-3.5 h-3.5" />
                                : <TrendingDown className="w-3.5 h-3.5" />}
                              {project.roiPercent}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-500 text-xs">{project.jornadasCount}</td>
                        </tr>

                        {/* Expanded detail row */}
                        {expanded === project.id && (
                          <tr key={`${project.id}-detail`} className="bg-blue-50/40 border-b">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                  <p className="text-gray-400 mb-1">Ingresos del cliente</p>
                                  <p className="font-bold text-base">{fmt(project.revenue)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-red-100">
                                  <p className="text-gray-400 mb-1">Pagos a técnicos</p>
                                  <p className="font-bold text-base text-red-600">− {fmt(project.laborCost)}</p>
                                  <p className="text-gray-300 mt-0.5">{project.jornadasCount} jornada{project.jornadasCount !== 1 ? 's' : ''}</p>
                                </div>
                                <div className={`bg-white rounded-lg p-3 border ${project.profit >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
                                  <p className="text-gray-400 mb-1">Utilidad neta</p>
                                  <p className={`font-bold text-base ${project.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(project.profit)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                  <p className="text-gray-400 mb-1">Presupuesto estimado</p>
                                  <p className="font-bold text-base text-gray-600">{fmt(project.costoEstimado)}</p>
                                  {project.costoEstimado > 0 && (
                                    <p className={`text-[10px] mt-0.5 ${project.laborCost <= project.costoEstimado ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {project.laborCost <= project.costoEstimado ? '✓ Dentro del presupuesto' : '⚠ Excedió presupuesto'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
