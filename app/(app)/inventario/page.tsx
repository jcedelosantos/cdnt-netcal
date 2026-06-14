'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Monitor, Users, FileText, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/animate';

interface Stats {
  equipos: number;
  clientes: number;
  licencias: number;
  consumos: number;
}

export default function InventarioDashboard() {
  const [stats, setStats] = useState<Stats>({ equipos: 0, clientes: 0, licencias: 0, consumos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eq, cl, li, co] = await Promise.all([
          fetch('/api/inventario/equipos').then(r => r.json()),
          fetch('/api/inventario/clientes').then(r => r.json()),
          fetch('/api/inventario/licencias').then(r => r.json()),
          fetch('/api/inventario/consumos').then(r => r.json()),
        ]);
        setStats({
          equipos: (eq || []).length,
          clientes: (cl || []).length,
          licencias: (li || []).length,
          consumos: (co || []).length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const sections = [
    {
      href: '/inventario/clientes',
      icon: Users,
      label: 'Clientes',
      count: stats.clientes,
      color: 'bg-blue-100 text-blue-600',
      description: 'Gestión de clientes',
    },
    {
      href: '/inventario/equipos',
      icon: Monitor,
      label: 'Equipos',
      count: stats.equipos,
      color: 'bg-purple-100 text-purple-600',
      description: 'Inventario de dispositivos',
    },
    {
      href: '/inventario/licencias',
      icon: FileText,
      label: 'Licencias',
      count: stats.licencias,
      color: 'bg-green-100 text-green-600',
      description: 'Software licenses',
    },
    {
      href: '/inventario/consumos',
      icon: TrendingUp,
      label: 'Consumos',
      count: stats.consumos,
      color: 'bg-orange-100 text-orange-600',
      description: 'Gastos mensuales',
    },
  ];

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Módulo Inventario</h1>
          <p className="text-gray-500 mt-2">Gestión integral de equipos, licencias y clientes</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="space-y-2">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${section.color}`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{section.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold">
                    {loading ? '-' : section.count}
                  </div>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Accesos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/inventario/clientes"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium mb-1">➕ Agregar Cliente</div>
              <p className="text-sm text-gray-500">Crear nuevo cliente</p>
            </Link>
            <Link
              href="/inventario/equipos"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium mb-1">➕ Registrar Equipo</div>
              <p className="text-sm text-gray-500">Agregar nuevo dispositivo</p>
            </Link>
            <Link
              href="/inventario/licencias"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium mb-1">➕ Nueva Licencia</div>
              <p className="text-sm text-gray-500">Registrar software</p>
            </Link>
            <Link
              href="/inventario/consumos"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium mb-1">➕ Agregar Consumo</div>
              <p className="text-sm text-gray-500">Registrar gasto mensual</p>
            </Link>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
