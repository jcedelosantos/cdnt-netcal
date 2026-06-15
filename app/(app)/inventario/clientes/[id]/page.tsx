'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Monitor, FileText, Users, TrendingUp, Rocket, RefreshCw, Cpu, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TemplatePreload from '../../_components/template-preload';
import { toast } from 'sonner';

interface TicInventario {
  id: string;
  nombre: string;
  estado: string;
  gastoAnual: number;
  categorias: number;
  updatedAt: string;
}

const TIC_ESTADO: Record<string, string> = {
  borrador: 'bg-yellow-100 text-yellow-700',
  completado: 'bg-green-100 text-green-700',
  archivado: 'bg-gray-100 text-gray-600',
};

interface Client {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

interface Section {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  items: any[];
  columns: { key: string; label: string; render?: (v: any) => React.ReactNode }[];
}

export default function ClienteInventarioPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    equipos: any[];
    licencias: any[];
    soportes: any[];
    consumos: any[];
    proyectos: any[];
  }>({ equipos: [], licencias: [], soportes: [], consumos: [], proyectos: [] });
  const [ticInventarios, setTicInventarios] = useState<TicInventario[]>([]);

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/inventario/clientes/${clientId}`);
    if (res.ok) setClient(await res.json());
  }, [clientId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eq, li, so, co, pr, tic] = await Promise.all([
        fetch(`/api/inventario/equipos?clientId=${clientId}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/inventario/licencias?clientId=${clientId}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/inventario/soportes?clientId=${clientId}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/inventario/consumos?clientId=${clientId}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/inventario/proyectos?clientId=${clientId}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/inventario-tic?clientId=${clientId}`).then(r => r.ok ? r.json() : []),
      ]);
      setData({
        equipos: eq || [],
        licencias: li || [],
        soportes: so || [],
        consumos: co || [],
        proyectos: pr || [],
      });
      setTicInventarios(tic || []);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
    fetchData();
  }, [fetchClient, fetchData]);

  const sections: Section[] = [
    {
      key: 'equipos',
      label: 'Equipos',
      icon: Monitor,
      color: 'text-purple-600',
      items: data.equipos,
      columns: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo', label: 'Tipo', render: v => v ?? '—' },
        { key: 'marca', label: 'Marca', render: v => v ?? '—' },
        { key: 'estado', label: 'Estado', render: v => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ?? '—'}</span>
        )},
      ],
    },
    {
      key: 'licencias',
      label: 'Licencias',
      icon: FileText,
      color: 'text-green-600',
      items: data.licencias,
      columns: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'categoria', label: 'Categoría', render: v => v ?? '—' },
        { key: 'proveedor', label: 'Proveedor', render: v => v ?? '—' },
        { key: 'costoAnual', label: 'Costo Anual', render: v => `$${(v ?? 0).toLocaleString()}` },
        { key: 'estado', label: 'Estado', render: v => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'activa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ?? '—'}</span>
        )},
      ],
    },
    {
      key: 'soportes',
      label: 'Soportes Tercerizados',
      icon: Users,
      color: 'text-blue-600',
      items: data.soportes,
      columns: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'contacto', label: 'Contacto', render: v => v ?? '—' },
        { key: 'servicios', label: 'Servicios', render: v => v ?? '—' },
        { key: 'costoMensual', label: 'Costo/Mes', render: v => `$${(v ?? 0).toLocaleString()}` },
        { key: 'estado', label: 'Estado', render: v => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ?? '—'}</span>
        )},
      ],
    },
    {
      key: 'consumos',
      label: 'Consumos Mensuales',
      icon: TrendingUp,
      color: 'text-orange-600',
      items: data.consumos,
      columns: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'categoria', label: 'Categoría', render: v => v ?? '—' },
        { key: 'costoMensual', label: 'Costo/Mes', render: v => `$${(v ?? 0).toLocaleString()}` },
        { key: 'estado', label: 'Estado', render: v => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ?? '—'}</span>
        )},
      ],
    },
    {
      key: 'proyectos',
      label: 'Proyectos en Curso',
      icon: Rocket,
      color: 'text-indigo-600',
      items: data.proyectos,
      columns: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'descripcion', label: 'Descripción', render: v => v ?? '—' },
        { key: 'avance', label: 'Avance', render: v => `${v ?? 0}%` },
        { key: 'estado', label: 'Estado', render: v => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'completado' ? 'bg-green-100 text-green-700' : v === 'en_progreso' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {v === 'en_progreso' ? 'En progreso' : v === 'completado' ? 'Completado' : v ?? '—'}
          </span>
        )},
      ],
    },
  ];

  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0) + ticInventarios.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/inventario/clientes')} className="gap-2 -ml-2 mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver a Clientes
        </Button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{client?.nombre ?? '...'}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
              {client?.contacto && <span>{client.contacto}</span>}
              {client?.telefono && <span>· {client.telefono}</span>}
              {client?.email && <span>· {client.email}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1 text-gray-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <TemplatePreload clientId={clientId} onSuccess={fetchData} />
          </div>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {sections.map(sec => (
          <div key={sec.key} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{loading ? '—' : sec.items.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sec.label}</p>
          </div>
        ))}
        <div className="bg-teal-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-teal-700">{loading ? '—' : ticInventarios.length}</p>
          <p className="text-xs text-teal-600 mt-0.5">Docs TIC</p>
        </div>
      </div>

      {/* Secciones */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando inventario...</div>
      ) : totalItems === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-gray-500">Este cliente no tiene inventario aún.</p>
            <p className="text-sm text-gray-400">Usa <strong>⚡ Precarga Rápida</strong> para cargar datos predefinidos, o agrega elementos desde las secciones del menú.</p>
          </CardContent>
        </Card>
      ) : (
        <>
        {ticInventarios.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-600" />
                  Documentos de Inventario TIC
                  <span className="text-xs font-normal text-gray-400">({ticInventarios.length})</span>
                </span>
                <Link href={`/inventario-tic/crear`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Nuevo
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ticInventarios.map(inv => (
                  <Link key={inv.id} href={`/inventario-tic/${inv.id}`}>
                    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 group">
                      <div>
                        <p className="text-sm font-medium group-hover:text-blue-600">{inv.nombre}</p>
                        <p className="text-xs text-gray-500">{inv.categorias ?? 0} categorías</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.gastoAnual > 0 && (
                          <span className="text-xs text-gray-600">${inv.gastoAnual.toLocaleString()}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${TIC_ESTADO[inv.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {inv.estado}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {sections
          .filter(sec => sec.items.length > 0)
          .map(sec => (
            <Card key={sec.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <sec.icon className={`w-4 h-4 ${sec.color}`} />
                  {sec.label}
                  <span className="text-xs font-normal text-gray-400 ml-1">({sec.items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        {sec.columns.map(col => (
                          <th key={col.key} className="text-left py-2 px-3 font-medium text-gray-600 text-xs">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.items.map((item, i) => (
                        <tr key={item.id ?? i} className="border-b hover:bg-gray-50">
                          {sec.columns.map(col => (
                            <td key={col.key} className="py-2 px-3">
                              {col.render ? col.render(item[col.key]) : (item[col.key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        }
        </>
      )}
    </div>
  );
}
