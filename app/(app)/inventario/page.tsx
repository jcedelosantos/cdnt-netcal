'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Monitor, Users, FileText, TrendingUp, Package, Plus,
  BarChart3, Archive, ChevronRight, Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';

interface TicInventario {
  id: string;
  nombre: string;
  cliente: { nombre: string; id: string };
  gastoAnual: number;
  categorias: number;
  estado: string;
  updatedAt: string;
}

interface Stats {
  clientes: number;
  equipos: number;
  licencias: number;
  consumos: number;
  soportes: number;
  proyectos: number;
  ticInventarios: number;
}

const ESTADO_STYLE: Record<string, string> = {
  borrador: 'bg-yellow-100 text-yellow-700',
  completado: 'bg-green-100 text-green-700',
  archivado: 'bg-gray-100 text-gray-600',
};

export default function InventarioDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    clientes: 0, equipos: 0, licencias: 0, consumos: 0,
    soportes: 0, proyectos: 0, ticInventarios: 0,
  });
  const [ticInventarios, setTicInventarios] = useState<TicInventario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cl, eq, li, co, so, pr, tic] = await Promise.all([
          fetch('/api/inventario/clientes').then(r => r.ok ? r.json() : []),
          fetch('/api/inventario/equipos').then(r => r.ok ? r.json() : []),
          fetch('/api/inventario/licencias').then(r => r.ok ? r.json() : []),
          fetch('/api/inventario/consumos').then(r => r.ok ? r.json() : []),
          fetch('/api/inventario/soportes').then(r => r.ok ? r.json() : []),
          fetch('/api/inventario/proyectos').then(r => r.ok ? r.json() : []),
          fetch('/api/inventario-tic').then(r => r.ok ? r.json() : []),
        ]);
        setStats({
          clientes: (cl || []).length,
          equipos: (eq || []).length,
          licencias: (li || []).length,
          consumos: (co || []).length,
          soportes: (so || []).length,
          proyectos: (pr || []).length,
          ticInventarios: (tic || []).length,
        });
        setTicInventarios((tic || []).slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold">Inventario TIC</h1>
          <p className="text-sm text-gray-500 mt-1">Activos tecnológicos, licencias, soportes y documentos de inventario</p>
        </div>
      </FadeIn>

      {/* KPIs generales */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { href: '/inventario/clientes', icon: Users, label: 'Clientes', count: stats.clientes, color: 'text-blue-600 bg-blue-50' },
            { href: '/inventario/equipos', icon: Monitor, label: 'Equipos', count: stats.equipos, color: 'text-purple-600 bg-purple-50' },
            { href: '/inventario/licencias', icon: FileText, label: 'Licencias', count: stats.licencias, color: 'text-green-600 bg-green-50' },
            { href: '/inventario/soportes', icon: Users, label: 'Soportes', count: stats.soportes, color: 'text-sky-600 bg-sky-50' },
            { href: '/inventario/consumos', icon: TrendingUp, label: 'Consumos', count: stats.consumos, color: 'text-orange-600 bg-orange-50' },
            { href: '/inventario/proyectos-it', icon: BarChart3, label: 'Proyectos TI', count: stats.proyectos, color: 'text-indigo-600 bg-indigo-50' },
            { href: '/inventario-tic', icon: Cpu, label: 'Docs TIC', count: stats.ticInventarios, color: 'text-teal-600 bg-teal-50' },
          ].map(s => (
            <Link key={s.href} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 space-y-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold">{loading ? '—' : s.count}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sección: Clientes */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Clientes
                </CardTitle>
                <div className="flex gap-2">
                  <Link href="/inventario/clientes">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      Ver todos <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: '/inventario/clientes', icon: Users, label: 'Clientes', color: 'bg-blue-50 text-blue-700' },
                  { href: '/inventario/equipos', icon: Monitor, label: 'Equipos', color: 'bg-purple-50 text-purple-700' },
                  { href: '/inventario/licencias', icon: FileText, label: 'Licencias', color: 'bg-green-50 text-green-700' },
                  { href: '/inventario/soportes', icon: Users, label: 'Soportes', color: 'bg-sky-50 text-sky-700' },
                  { href: '/inventario/consumos', icon: TrendingUp, label: 'Consumos', color: 'bg-orange-50 text-orange-700' },
                  { href: '/inventario/proyectos-it', icon: BarChart3, label: 'Proyectos TI', color: 'bg-indigo-50 text-indigo-700' },
                ].map(s => (
                  <Link key={s.href} href={s.href}>
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg hover:opacity-80 transition-opacity ${s.color}`}>
                      <s.icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Sección: Documentos de Inventario TIC */}
        <FadeIn delay={0.15}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-600" />
                  Documentos de Inventario TIC
                </CardTitle>
                <div className="flex gap-2">
                  <Link href="/inventario-tic">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      Ver todos <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                  <Link href="/inventario-tic/crear">
                    <Button size="sm" className="h-7 text-xs gap-1">
                      <Plus className="w-3 h-3" /> Nuevo
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-sm text-gray-400 py-4 text-center">Cargando...</p>
              ) : ticInventarios.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Package className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400">Sin inventarios TIC aún</p>
                  <Link href="/inventario-tic/crear">
                    <Button size="sm" variant="outline" className="mt-1">Crear primero</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {ticInventarios.map(inv => (
                    <Link key={inv.id} href={`/inventario-tic/${inv.id}`}>
                      <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-blue-600">{inv.nombre}</p>
                          <p className="text-xs text-gray-500">{inv.cliente?.nombre} · {inv.categorias ?? 0} categorías</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {inv.gastoAnual > 0 && (
                            <span className="text-xs font-medium text-gray-600">${inv.gastoAnual.toLocaleString()}</span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ESTADO_STYLE[inv.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                            {inv.estado}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {stats.ticInventarios > 6 && (
                    <Link href="/inventario-tic">
                      <p className="text-xs text-center text-blue-600 hover:underline pt-1">
                        Ver {stats.ticInventarios - 6} más…
                      </p>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
