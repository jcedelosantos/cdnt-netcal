'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  AlertCircle,
  Monitor,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/animate';
import { formatUSD } from '@/lib/utils';

interface UnifiedStats {
  redcalc: {
    proyectosActivos: number;
    cotizacionesPendientes: number;
    facturasPendienteDePago: number;
    totalFacturado: number;
  };
  inventario: {
    equiposActivos: number;
    licenciasProxAVencer: number;
    costoMensualTotal: number;
    clientesActivos: number;
  };
}

export default function UnifiedDashboard() {
  const [stats, setStats] = useState<UnifiedStats>({
    redcalc: {
      proyectosActivos: 0,
      cotizacionesPendientes: 0,
      facturasPendienteDePago: 0,
      totalFacturado: 0,
    },
    inventario: {
      equiposActivos: 0,
      licenciasProxAVencer: 0,
      costoMensualTotal: 0,
      clientesActivos: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch RedCalc stats
        const projectsRes = await fetch('/api/projects?limit=1000');
        const projects = (await projectsRes.json()).data || [];

        // Fetch Inventario stats
        const equipmentRes = await fetch('/api/inventario/equipos');
        const clientsRes = await fetch('/api/inventario/clientes');
        const consumptionsRes = await fetch('/api/inventario/consumos');

        const equipment = await equipmentRes.json();
        const clients = await clientsRes.json();
        const consumptions = await consumptionsRes.json();

        const redcalcStats = {
          proyectosActivos: projects.filter(
            (p: any) => !p.numeroFactura
          ).length,
          cotizacionesPendientes: projects.filter(
            (p: any) => !p.aprobado
          ).length,
          facturasPendienteDePago: projects.filter(
            (p: any) => p.numeroFactura && p.estadoPago !== 'pagado'
          ).length,
          totalFacturado: projects
            .filter((p: any) => p.numeroFactura)
            .reduce((sum: number, p: any) => sum + (p.totalFactura || 0), 0),
        };

        const inventarioStats = {
          equiposActivos: (equipment || []).filter(
            (e: any) => e.estado === 'activo'
          ).length,
          licenciasProxAVencer: 0, // TODO: calcular
          costoMensualTotal: (consumptions || []).reduce(
            (sum: number, c: any) => sum + (c.costoMensual || 0),
            0
          ),
          clientesActivos: (clients || []).filter(
            (c: any) => c.activo
          ).length,
        };

        setStats({
          redcalc: redcalcStats,
          inventario: inventarioStats,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">
            Dashboard Unificado
          </h1>
          <p className="text-gray-500 mt-2">
            KPIs de Proyectos de Redes + Inventario de Equipos
          </p>
        </div>
      </FadeIn>

      {/* RedCalc Module */}
      <FadeIn delay={0.1}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Proyectos de Redes (RedCalc)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Proyectos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? '-' : stats.redcalc.proyectosActivos}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Cotizaciones Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {loading ? '-' : stats.redcalc.cotizacionesPendientes}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Facturas por Pagar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {loading ? '-' : stats.redcalc.facturasPendienteDePago}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Facturado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {loading ? '-' : formatUSD(stats.redcalc.totalFacturado)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>

      {/* Inventory Module */}
      <FadeIn delay={0.2}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-purple-600" />
            Inventario de Equipos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Equipos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? '-' : stats.inventario.equiposActivos}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? '-' : stats.inventario.clientesActivos}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Costo Mensual Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {loading
                    ? '-'
                    : formatUSD(stats.inventario.costoMensualTotal)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Costo Anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {loading
                    ? '-'
                    : formatUSD(stats.inventario.costoMensualTotal * 12)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>

      {/* Summary Card */}
      <FadeIn delay={0.3}>
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos (Facturas)</p>
              <p className="text-2xl font-bold text-green-600">
                {formatUSD(stats.redcalc.totalFacturado)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Gastos Anuales (Inventario)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatUSD(stats.inventario.costoMensualTotal * 12)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Margen Neto (Proyectado)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatUSD(
                  stats.redcalc.totalFacturado -
                    stats.inventario.costoMensualTotal * 12
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Quick Links */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Enlaces Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/proyectos?estado=facturados"
              className="p-3 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-sm">📊 Ver Proyectos</div>
              <p className="text-xs text-gray-500">Filtrados por estado</p>
            </Link>
            <Link
              href="/inventario"
              className="p-3 border rounded-lg hover:bg-purple-50 transition-colors"
            >
              <div className="font-medium text-sm">📦 Ver Inventario</div>
              <p className="text-xs text-gray-500">Equipos y licencias</p>
            </Link>
            <Link
              href="/reportes"
              className="p-3 border rounded-lg hover:bg-orange-50 transition-colors"
            >
              <div className="font-medium text-sm">📈 Reportes 607</div>
              <p className="text-xs text-gray-500">Registro de ventas DGII</p>
            </Link>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
