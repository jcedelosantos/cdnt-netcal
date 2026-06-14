'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';

interface ROIProject {
  id: string;
  nombre: string;
  cliente?: string;
  estado: string;
  revenue: number;
  costs: number;
  profit: number;
  roiPercent: number;
  marginPercent: number;
  daysActive: number;
  createdAt: string;
}

interface ROISummary {
  totalProjects: number;
  totalRevenue: number;
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
  const [sortBy, setSortBy] = useState<'roi' | 'revenue' | 'profit'>('roi');

  useEffect(() => {
    fetchROI();
  }, []);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'profitable') return p.profit > 0;
    if (filter === 'loss') return p.profit < 0;
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'roi') return b.roiPercent - a.roiPercent;
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    return b.profit - a.profit;
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Análisis de ROI</h1>
          <p className="text-gray-500 mt-2">Rentabilidad por proyecto e ingresos vs costos</p>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-2">{summary?.totalProjects || 0} proyectos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-600 mb-1">Costos Estimados</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.totalCosts || 0)}</p>
              <p className="text-xs text-gray-500 mt-2">Margen promedio</p>
            </CardContent>
          </Card>

          <Card className={summary?.totalProfit! > 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
            <CardContent className="pt-6">
              <p className={`text-xs font-medium mb-1 ${summary?.totalProfit! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                Ganancia Neta
              </p>
              <p className={`text-2xl font-bold ${summary?.totalProfit! > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(summary?.totalProfit || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">{summary?.profitableProjects} rentables</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-blue-600 font-medium mb-1">ROI Promedio</p>
              <p className="text-2xl font-bold text-blue-700">{summary?.avgRoi || 0}%</p>
              <p className="text-xs text-gray-500 mt-2">Margen {summary?.avgMargin || 0}%</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'profitable' ? 'default' : 'outline'}
            onClick={() => setFilter('profitable')}
            size="sm"
            className={filter === 'profitable' ? 'bg-green-600' : ''}
          >
            Rentables
          </Button>
          <Button
            variant={filter === 'loss' ? 'default' : 'outline'}
            onClick={() => setFilter('loss')}
            size="sm"
            className={filter === 'loss' ? 'bg-red-600' : ''}
          >
            Pérdida
          </Button>

          <div className="flex-1" />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-200 rounded-lg"
          >
            <option value="roi">ROI %</option>
            <option value="revenue">Ingresos</option>
            <option value="profit">Ganancia</option>
          </select>
        </div>
      </FadeIn>

      {/* Projects Table */}
      <FadeIn delay={0.3}>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : sortedProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin proyectos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-3 font-medium">Proyecto</th>
                      <th className="text-right py-3 px-3 font-medium">Ingresos</th>
                      <th className="text-right py-3 px-3 font-medium">Costos</th>
                      <th className="text-right py-3 px-3 font-medium">Ganancia</th>
                      <th className="text-right py-3 px-3 font-medium">ROI %</th>
                      <th className="text-right py-3 px-3 font-medium">Margen %</th>
                      <th className="text-right py-3 px-3 font-medium">Días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="font-medium">{project.nombre}</div>
                          <div className="text-xs text-gray-500">{project.cliente}</div>
                        </td>
                        <td className="text-right py-3 px-3 font-medium">
                          {formatCurrency(project.revenue)}
                        </td>
                        <td className="text-right py-3 px-3 text-gray-600">
                          {formatCurrency(project.costs)}
                        </td>
                        <td className="text-right py-3 px-3">
                          <span
                            className={
                              project.profit > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                            }
                          >
                            {formatCurrency(project.profit)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-3">
                          <span className="flex items-center justify-end gap-1">
                            {project.roiPercent > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium">{project.roiPercent}%</span>
                          </span>
                        </td>
                        <td className="text-right py-3 px-3">{project.marginPercent}%</td>
                        <td className="text-right py-3 px-3 text-gray-600">{project.daysActive}</td>
                      </tr>
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
