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

export default function DashboardClient({ stats, recentProjects, recentInventarios, tecnicosStats, userName }: Props) {
  const [proyectosExpanded, setProyectosExpanded] = useState(true);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight">
            ¡Hola, <span className="text-primary">{userName ?? 'Usuario'}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestione y calcule materiales para sus proyectos de redes y cableado estructurado.
          </p>
        </div>
      </FadeIn>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SlideIn from="bottom" delay={0.1}>
          <Link href="/proyectos">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold">{stats?.total ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Proyectos totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </SlideIn>
        <SlideIn from="bottom" delay={0.15}>
          <Link href="/proyectos?estado=aprobados">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold">{stats?.aprobados ?? 0}</p>
                    <p className="text-sm text-muted-foreground">
                      Aprobados
                      {(stats?.pendientes ?? 0) > 0 && (
                        <span className="text-muted-foreground/70"> · {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </SlideIn>
        <SlideIn from="bottom" delay={0.2}>
          <Link href="/proyectos?estado=facturados">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold">{stats?.facturados ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Facturados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </SlideIn>
        <SlideIn from="bottom" delay={0.3}>
          <Link href="/proyecto/nuevo">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <PlusCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-primary">Nuevo Proyecto</p>
                    <p className="text-sm text-muted-foreground">Iniciar cálculo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </SlideIn>
      </div>

      {/* Proyectos Recientes — colapsable */}
      <FadeIn delay={0.3}>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                Proyectos Recientes
              </CardTitle>
              {proyectosExpanded && (
                <CardDescription>Sus últimos proyectos de cálculo de materiales</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {proyectosExpanded && (recentProjects?.length ?? 0) > 0 && (
                <Link href="/proyectos">
                  <Button variant="outline" size="sm">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProyectosExpanded(v => !v)}
                className="text-muted-foreground"
              >
                {proyectosExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="ml-1 text-xs">{proyectosExpanded ? 'Contraer' : 'Expandir'}</span>
              </Button>
            </div>
          </CardHeader>

          {proyectosExpanded && (
            <CardContent>
              {(recentProjects?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <Cable className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aún no tiene proyectos</p>
                  <Link href="/proyecto/nuevo">
                    <Button className="mt-4"><PlusCircle className="w-4 h-4 mr-2" /> Crear primer proyecto</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {(recentProjects ?? []).map((p: any) => (
                    <Link key={p?.id} href={`/proyecto/${p?.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p?.cliente ?? 'Sin cliente'} • {p?.categoriaCable ?? 'Cat6'} • {p?.totalPuntos ?? 0} puntos
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </FadeIn>

      {/* Técnicos — resumen */}
      <FadeIn delay={0.35}>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Técnicos y Nómina
              </CardTitle>
              <CardDescription>Estado del equipo y pagos pendientes</CardDescription>
            </div>
            <Link href="/tecnicos">
              <Button variant="outline" size="sm">Ir a Técnicos <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Técnicos activos */}
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

              {/* Jornadas pendientes */}
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

              {/* Períodos activos */}
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

              {/* Neto en revisión */}
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
        </Card>
      </FadeIn>

      {/* Inventarios TIC Recientes */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Inventarios TIC
              </CardTitle>
              <CardDescription>Activos tecnológicos por cliente</CardDescription>
            </div>
            <div className="flex gap-2">
              {(recentInventarios?.length ?? 0) > 0 && (
                <Link href="/inventario-tic">
                  <Button variant="outline" size="sm">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              )}
              <Link href="/inventario-tic/crear">
                <Button size="sm" className="gap-1">
                  <PlusCircle className="w-4 h-4" /> Nuevo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
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
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{inv.nombre}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              inv.estado === 'completado'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {inv.estado === 'completado' ? 'Completado' : 'Borrador'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {inv.cliente} • {inv.categorias} categoría{inv.categorias !== 1 ? 's' : ''} • ${(inv.gastoAnual ?? 0).toLocaleString()} anual
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
