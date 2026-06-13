'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import {
  PlusCircle, FolderOpen, Cable,
  Receipt, Network, ArrowRight, CheckCircle2, Clock,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  stats: { total: number; facturados: number; aprobados: number; pendientes: number };
  recentProjects: any[];
  userName: string;
}

export default function DashboardClient({ stats, recentProjects, userName }: Props) {
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

      <FadeIn delay={0.3}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                Proyectos Recientes
              </CardTitle>
              <CardDescription>Sus últimos proyectos de cálculo de materiales</CardDescription>
            </div>
            {(recentProjects?.length ?? 0) > 0 && (
              <Link href="/proyectos">
                <Button variant="outline" size="sm">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            )}
          </CardHeader>
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
        </Card>
      </FadeIn>
    </div>
  );
}
