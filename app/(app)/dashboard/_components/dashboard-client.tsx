'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import {
  PlusCircle, FolderOpen, Cable,
  Receipt, Network, ArrowRight, CheckCircle2, Clock, Monitor,
  ChevronDown, ChevronUp, Users, CalendarClock, Wallet, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  stats: { total: number; facturados: number; aprobados: number; pendientes: number };
  recentProjects: any[];
  recentInventarios: any[];
  tecnicosStats: { total: number; jornadasPendientes: number; periodosActivos: number; netoEnRevision: number };
  userName: string;
}

function SectionHeader({
  title, description, icon, expanded, onToggle, actions,
}: {
  title: string; description?: string; icon: React.ReactNode;
  expanded: boolean; onToggle: () => void; actions?: React.ReactNode;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <div>
        <CardTitle className="font-display flex items-center gap-2">
          {icon}{title}
        </CardTitle>
        {expanded && description && <CardDescription>{description}</CardDescription>}
      </div>
      <div className="flex items-center gap-2">
        {expanded && actions}
        <Button variant="ghost" size="sm" onClick={onToggle} className="text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="ml-1 text-xs">{expanded ? 'Contraer' : 'Expandir'}</span>
        </Button>
      </div>
    </CardHeader>
  );
}

export default function DashboardClient({ stats, recentProjects, recentInventarios, tecnicosStats, userName }: Props) {
  const [proyectosExpanded, setProyectosExpanded] = useState(true);
  const [tecnicosExpanded,  setTecnicosExpanded]  = useState(true);
  const [inventarioExpanded, setInventarioExpanded] = useState(true);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Saludo */}
      <FadeIn>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            ¡Hola, <span className="text-primary">{userName ?? 'Usuario'}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestione y calcule materiales para sus proyectos de redes y cableado estructurado.
          </p>
        </div>
      </FadeIn>

      {/* ── Proyectos ──────────────────────────────────────────── */}
      <FadeIn delay={0.1}>
        <Card>
          <SectionHeader
            title="Proyectos Recientes"
            description="Sus últimos proyectos de cálculo de materiales"
            icon={<Network className="w-5 h-5 text-primary" />}
            expanded={proyectosExpanded}
            onToggle={() => setProyectosExpanded(v => !v)}
            actions={
              (recentProjects?.length ?? 0) > 0 && (
                <Link href="/proyectos">
                  <Button variant="outline" size="sm">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              )
            }
          />

          {proyectosExpanded && (
            <CardContent className="pt-0">
              {/* 4 KPI buttons */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <Link href="/proyectos">
                  <div className="rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors p-3 cursor-pointer flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl font-mono font-bold leading-none">{stats?.total ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                    </div>
                  </div>
                </Link>
                <Link href="/proyectos?estado=aprobados">
                  <div className="rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors p-3 cursor-pointer flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-mono font-bold leading-none">{stats?.aprobados ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Aprobados</p>
                    </div>
                  </div>
                </Link>
                <Link href="/proyectos?estado=facturados">
                  <div className="rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors p-3 cursor-pointer flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xl font-mono font-bold leading-none">{stats?.facturados ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Facturados</p>
                    </div>
                  </div>
                </Link>
                <Link href="/proyecto/nuevo">
                  <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-3 cursor-pointer flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <PlusCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary leading-none">Nuevo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Iniciar cálculo</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Lista de proyectos */}
              {(recentProjects?.length ?? 0) === 0 ? (
                <div className="text-center py-10">
                  <Cable className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Aún no tiene proyectos</p>
                  <Link href="/proyecto/nuevo">
                    <Button className="mt-4" size="sm"><PlusCircle className="w-4 h-4 mr-2" /> Crear primer proyecto</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(recentProjects ?? []).map((p: any) => (
                    <Link key={p?.id} href={`/proyecto/${p?.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Network className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{p?.nombre ?? 'Sin nombre'}</p>
                              {p?.aprobado ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                  <CheckCircle2 className="w-3 h-3" /> Aprobado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  <Clock className="w-3 h-3" /> Pendiente
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p?.cliente ?? 'Sin cliente'} · {p?.categoriaCable ?? 'Cat6'} · {p?.totalPuntos ?? 0} puntos
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </FadeIn>

      {/* ── Técnicos ───────────────────────────────────────────── */}
      <FadeIn delay={0.2}>
        <Card>
          <SectionHeader
            title="Técnicos y Nómina"
            description="Estado del equipo y pagos pendientes"
            icon={<Users className="w-5 h-5 text-teal-600" />}
            expanded={tecnicosExpanded}
            onToggle={() => setTecnicosExpanded(v => !v)}
            actions={
              <Link href="/tecnicos">
                <Button variant="outline" size="sm">Ir a Técnicos <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            }
          />

          {tecnicosExpanded && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/tecnicos">
                  <div className="rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors p-4 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="text-2xl font-bold font-mono">{tecnicosStats.total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Técnicos activos</p>
                  </div>
                </Link>
                <Link href="/tecnicos">
                  <div className={`rounded-xl border hover:bg-muted/60 transition-colors p-4 cursor-pointer ${tecnicosStats.jornadasPendientes > 0 ? 'bg-amber-50 border-amber-200' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tecnicosStats.jornadasPendientes > 0 ? 'bg-amber-100' : 'bg-muted'}`}>
                        <AlertCircle className={`w-4 h-4 ${tecnicosStats.jornadasPendientes > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-2xl font-bold font-mono">{tecnicosStats.jornadasPendientes}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Jornadas por aprobar</p>
                  </div>
                </Link>
                <Link href="/tecnicos">
                  <div className={`rounded-xl border hover:bg-muted/60 transition-colors p-4 cursor-pointer ${tecnicosStats.periodosActivos > 0 ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tecnicosStats.periodosActivos > 0 ? 'bg-blue-100' : 'bg-muted'}`}>
                        <CalendarClock className={`w-4 h-4 ${tecnicosStats.periodosActivos > 0 ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-2xl font-bold font-mono">{tecnicosStats.periodosActivos}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Períodos en proceso</p>
                  </div>
                </Link>
                <Link href="/tecnicos">
                  <div className={`rounded-xl border hover:bg-muted/60 transition-colors p-4 cursor-pointer ${tecnicosStats.netoEnRevision > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tecnicosStats.netoEnRevision > 0 ? 'bg-emerald-100' : 'bg-muted'}`}>
                        <Wallet className={`w-4 h-4 ${tecnicosStats.netoEnRevision > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-lg font-bold font-mono leading-tight">
                        {tecnicosStats.netoEnRevision > 0 ? `RD$ ${tecnicosStats.netoEnRevision.toLocaleString()}` : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Neto por pagar</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      </FadeIn>

      {/* ── Inventarios TIC ────────────────────────────────────── */}
      <FadeIn delay={0.3}>
        <Card>
          <SectionHeader
            title="Inventarios TIC"
            description="Activos tecnológicos por cliente"
            icon={<Monitor className="w-5 h-5 text-blue-600" />}
            expanded={inventarioExpanded}
            onToggle={() => setInventarioExpanded(v => !v)}
            actions={
              <div className="flex gap-2">
                {(recentInventarios?.length ?? 0) > 0 && (
                  <Link href="/inventario-tic">
                    <Button variant="outline" size="sm">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </Link>
                )}
                <Link href="/inventario-tic/crear">
                  <Button size="sm" className="gap-1"><PlusCircle className="w-4 h-4" /> Nuevo</Button>
                </Link>
              </div>
            }
          />

          {inventarioExpanded && (
            <CardContent className="pt-0">
              {(recentInventarios?.length ?? 0) === 0 ? (
                <div className="text-center py-10">
                  <Monitor className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No hay inventarios aún</p>
                  <Link href="/inventario-tic/crear">
                    <Button className="mt-4" variant="outline" size="sm">
                      <PlusCircle className="w-4 h-4 mr-2" /> Crear primer inventario
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(recentInventarios ?? []).map((inv: any) => (
                    <Link key={inv.id} href={`/inventario-tic/${inv.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{inv.nombre}</p>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                inv.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {inv.estado === 'completado' ? 'Completado' : 'Borrador'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {inv.cliente} · {inv.categorias} categoría{inv.categorias !== 1 ? 's' : ''} · ${(inv.gastoAnual ?? 0).toLocaleString()} anual
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
