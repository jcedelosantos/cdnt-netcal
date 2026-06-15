'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Monitor, Users, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';
import QuickTemplates from './_components/quick-templates';

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
    },
    {
      href: '/inventario/equipos',
      icon: Monitor,
      label: 'Equipos',
      count: stats.equipos,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      href: '/inventario/licencias',
      icon: FileText,
      label: 'Licencias',
      count: stats.licencias,
      color: 'bg-green-100 text-green-600',
    },
    {
      href: '/inventario/consumos',
      icon: TrendingUp,
      label: 'Consumos',
      count: stats.consumos,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-4">
      <FadeIn>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Inventario TIC</h1>
            <p className="text-sm text-gray-500 mt-1">Equipos, licencias y servicios</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <QuickTemplates />
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-3 space-y-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.color} w-fit`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{section.label}</p>
                    <p className="text-2xl font-bold">{loading ? '-' : section.count}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Link href="/inventario/clientes">
            <Button variant="outline" className="w-full justify-start text-xs h-9">
              ➕ Cliente
            </Button>
          </Link>
          <Link href="/inventario/equipos">
            <Button variant="outline" className="w-full justify-start text-xs h-9">
              ➕ Equipo
            </Button>
          </Link>
          <Link href="/inventario/licencias">
            <Button variant="outline" className="w-full justify-start text-xs h-9">
              ➕ Licencia
            </Button>
          </Link>
          <Link href="/inventario/consumos">
            <Button variant="outline" className="w-full justify-start text-xs h-9">
              ➕ Consumo
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
