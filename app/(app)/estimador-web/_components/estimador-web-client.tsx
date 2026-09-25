'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, Save, AlertTriangle, ExternalLink } from 'lucide-react';

type Config = {
  activo: boolean; margen: number; rangoPct: number;
  manoObraPorCamara: number; costoFijo: number; itbis: number;
};
type Material = { materialNombre: string; referenciaNombre: string | null; incluir: boolean };
type Referencia = { nombre: string; precio: number; fecha: string };
type Solicitud = { id: string; nombre: string; cliente: string | null; createdAt: string; aprobado: boolean };
type Ejemplo = { minimo: number; maximo: number; total: number; costoMateriales: number; sinPrecio: string[] } | null;

const dop = (n: number) => `RD$ ${n.toLocaleString('es-DO', { maximumFractionDigits: 0 })}`;

export default function EstimadorWebClient() {
  const [config, setConfig] = useState<Config | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [ejemplo, setEjemplo] = useState<Ejemplo>(null);
  const [saving, setSaving] = useState(false);

  const aplicar = (data: any) => {
    setConfig(data.config);
    setMateriales(data.materiales);
    setReferencias(data.referencias);
    setSolicitudes(data.solicitudes);
    setEjemplo(data.ejemplo);
  };

  useEffect(() => {
    fetch('/api/estimador-config')
      .then((r) => r.json())
      .then(aplicar)
      .catch(() => toast.error('Error al cargar el estimador'));
  }, []);

  const precioPorNombre = useMemo(
    () => new Map(referencias.map((r) => [r.nombre.toLowerCase(), r.precio])),
    [referencias]
  );

  const sinAsignar = materiales.filter(
    (m) => m.incluir && !(m.referenciaNombre && precioPorNombre.has(m.referenciaNombre.toLowerCase()))
  ).length;

  const guardar = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/estimador-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, materiales }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Error al guardar'); return; }
      aplicar(data);
      toast.success('Estimador guardado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>;

  const campo = (key: keyof Config, label: string, ayuda?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type="number"
        min={0}
        value={String(config[key])}
        onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
      />
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Estimador web (CCTV)
          </h1>
          <p className="text-sm text-muted-foreground">
            Tarifa que usa el estimador de cedanet.net. Los clientes solo ven el rango final, nunca estos valores.
          </p>
        </div>
        <Button onClick={guardar} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Switch id="activo" checked={config.activo} onCheckedChange={(v) => setConfig({ ...config, activo: v })} />
            <Label htmlFor="activo">Estimador activo en la web</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campo('margen', 'Margen sobre precio de referencia (%)')}
            {campo('rangoPct', 'Ancho del rango mostrado (± %)')}
            {campo('itbis', 'ITBIS (%)')}
            {campo('manoObraPorCamara', 'Mano de obra por cámara (RD$)', 'Instalación y configuración de cada cámara.')}
            {campo('costoFijo', 'Costo fijo por proyecto (RD$)', 'Transporte, configuración del NVR, etc.')}
          </div>
          {ejemplo && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium">Ejemplo: 8 cámaras, distancia media, interior (con lo guardado)</p>
              <p className="mt-1">
                El cliente vería <strong>{dop(ejemplo.minimo)} – {dop(ejemplo.maximo)}</strong>
                {' '}· total calculado {dop(ejemplo.total)} · materiales al costo {dop(ejemplo.costoMateriales)}
              </p>
              {ejemplo.sinPrecio.length > 0 && (
                <p className="mt-2 text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Sin precio (se cuentan como 0): {ejemplo.sinPrecio.join(', ')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiales y precio de referencia</CardTitle>
          <p className="text-sm text-muted-foreground">
            Elige qué precio de referencia usa cada material (se toma el más reciente). Desmarca los que no quieras
            incluir en el estimado. {sinAsignar > 0 && <span className="text-amber-700">Faltan {sinAsignar} por asignar.</span>}
          </p>
        </CardHeader>
        <CardContent>
          <datalist id="referencias">
            {referencias.map((r) => <option key={r.nombre} value={r.nombre} />)}
          </datalist>
          <div className="divide-y">
            {materiales.map((m, i) => {
              const precio = m.referenciaNombre ? precioPorNombre.get(m.referenciaNombre.toLowerCase()) : undefined;
              const actualizar = (cambios: Partial<Material>) =>
                setMateriales(materiales.map((x, j) => (j === i ? { ...x, ...cambios } : x)));
              return (
                <div key={m.materialNombre} className="py-3 grid grid-cols-1 md:grid-cols-[auto_1fr_1.3fr_auto] gap-3 items-center">
                  <Switch
                    checked={m.incluir}
                    onCheckedChange={(v) => actualizar({ incluir: v })}
                    aria-label={`Incluir ${m.materialNombre}`}
                  />
                  <span className={`text-sm ${m.incluir ? '' : 'text-muted-foreground line-through'}`}>{m.materialNombre}</span>
                  <Input
                    list="referencias"
                    placeholder="Buscar precio de referencia…"
                    value={m.referenciaNombre ?? ''}
                    disabled={!m.incluir}
                    onChange={(e) => actualizar({ referenciaNombre: e.target.value || null })}
                  />
                  <span className={`text-sm tabular-nums text-right min-w-[110px] ${precio == null && m.incluir ? 'text-amber-700' : ''}`}>
                    {m.incluir ? (precio != null ? dop(precio) : 'Sin precio') : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Solicitudes recibidas desde la web</CardTitle></CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay solicitudes.</p>
          ) : (
            <ul className="divide-y">
              {solicitudes.map((s) => (
                <li key={s.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span>
                    {s.nombre}
                    <span className="text-muted-foreground"> · {new Date(s.createdAt).toLocaleDateString('es-DO')}</span>
                    {s.aprobado && <span className="ml-2 text-green-700">Aprobada</span>}
                  </span>
                  <Link href={`/proyecto/${s.id}`} className="text-primary inline-flex items-center gap-1 hover:underline">
                    Abrir <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
