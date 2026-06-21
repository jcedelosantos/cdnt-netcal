'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeIn } from '@/components/ui/animate';
import {
  Network, Search, PlusCircle, Copy, Trash2, ArrowRight,
  FolderOpen, Cable, Calendar, CheckCircle2, Clock, Wallet, BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';

const fmtFecha = (iso?: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtMonto = (v: number) =>
  'RD$ ' + v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProjectsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [clientes, setClientes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState(searchParams?.get('estado') ?? '');
  const [total, setTotal] = useState(0);

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (clienteFiltro) params.set('cliente', clienteFiltro);
      if (estadoFiltro) params.set('estado', estadoFiltro);
      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      setProjects(data?.data ?? []);
      setTotal(data?.total ?? 0);
      setClientes(data?.clientes ?? []);
    } catch {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, [search, clienteFiltro, estadoFiltro]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Proyecto duplicado');
        fetchProjects();
      }
    } catch {
      toast.error('Error al duplicar');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Proyecto eliminado');
        fetchProjects();
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleAprobado = async (id: string, aprobado: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Actualización optimista
    setProjects((prev) => prev.map((p) => (p?.id === id ? { ...p, aprobado: !aprobado } : p)));
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado: !aprobado }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json().catch(() => ({}));
      setProjects((prev) => prev.map((p) => (p?.id === id ? { ...p, aprobado: !aprobado, aprobadoEn: d?.aprobadoEn ?? null } : p)));
      toast.success(!aprobado ? 'Proyecto aprobado' : 'Aprobación retirada');
      // Si hay filtro de estado activo, refrescar para reflejar el cambio
      if (estadoFiltro) fetchProjects();
    } catch {
      // Revertir
      setProjects((prev) => prev.map((p) => (p?.id === id ? { ...p, aprobado } : p)));
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-2xl font-display font-bold tracking-tight flex items-center gap-2 hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <FolderOpen className="w-6 h-6 text-primary" />
              Mis Proyectos
            </button>
            <p className="text-muted-foreground text-sm">{total} proyecto{total !== 1 ? 's' : ''} guardado{total !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/proyecto/nuevo">
            <Button><PlusCircle className="w-4 h-4 mr-2" /> Nuevo Proyecto</Button>
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o cliente..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="h-10 px-3 rounded-md border border-input bg-background text-sm sm:w-52"
            value={clienteFiltro}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClienteFiltro(e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="h-10 px-3 rounded-md border border-input bg-background text-sm sm:w-40"
            value={estadoFiltro}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEstadoFiltro(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="aprobados">Aprobados</option>
            <option value="pendientes">Pendientes</option>
            <option value="facturados">Facturados</option>
            <option value="pagados">Pagados</option>
            <option value="pago_parcial">Pago parcial</option>
          </select>
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (projects?.length ?? 0) === 0 ? (
        <FadeIn>
          <div className="text-center py-20">
            <Cable className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              {search ? 'No se encontraron proyectos' : 'Aún no tiene proyectos'}
            </p>
            {!search && (
              <Link href="/proyecto/nuevo">
                <Button className="mt-2"><PlusCircle className="w-4 h-4 mr-2" /> Crear primer proyecto</Button>
              </Link>
            )}
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-3">
          {(projects ?? []).map((p: any, i: number) => (
            <FadeIn key={p?.id ?? i} delay={i * 0.05}>
              <Link href={`/proyecto/${p?.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Network className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{p?.nombre ?? 'Sin nombre'}</p>
                            {p?.aprobado ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3" /> Aprobado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                <Clock className="w-3 h-3" /> Pendiente
                              </span>
                            )}
                            {p?.estadoPago === 'parcial' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                <Wallet className="w-3 h-3" /> Pago parcial
                              </span>
                            )}
                            {p?.estadoPago === 'pagado' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                <BadgeCheck className="w-3 h-3" /> Pagado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {p?.cliente ?? 'Sin cliente'} • {p?.categoriaCable ?? 'Cat6'} • {p?.totalPuntos ?? 0} puntos
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> Creado el {fmtFecha(p?.createdAt)}
                            {p?.aprobado && p?.aprobadoEn && (
                              <span className="text-green-600">· Aprobado el {fmtFecha(p?.aprobadoEn)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {p?.totalGeneral != null && (
                          <span className="hidden sm:block text-sm font-mono font-semibold text-primary whitespace-nowrap">
                            {fmtMonto(p.totalGeneral)}
                          </span>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          className={`h-8 w-8 ${p?.aprobado ? 'text-green-600' : 'text-muted-foreground'}`}
                          title={p?.aprobado ? 'Quitar aprobación' : 'Marcar como aprobado'}
                          onClick={(e: React.MouseEvent) => handleToggleAprobado(p?.id, !!p?.aprobado, e)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: React.MouseEvent) => handleDuplicate(p?.id, e)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e: React.MouseEvent) => handleDelete(p?.id, e)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
