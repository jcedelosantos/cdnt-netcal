'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/animate';
import {
  Network, Building2, MapPin, Cable, Settings2,
  Plus, Trash2, Save, ArrowLeft, Server, Shield,
  Zap, ToggleLeft, ToggleRight, Monitor, Phone,
  Camera, Wifi, Radio,
} from 'lucide-react';

const TIPOS_PUNTO = [
  { value: 'datos', label: 'Datos' },
  { value: 'voz', label: 'Voz' },
  { value: 'datos_voz', label: 'Datos + Voz' },
  { value: 'camara_ip', label: 'Cámara IP' },
  { value: 'access_point', label: 'Access Point' },
  { value: 'telefono_ip', label: 'Teléfono IP' },
];

const TIPOS_CANALIZACION = [
  { value: 'MT', label: 'Tubo Metálico (MT)' },
  { value: 'EMT', label: 'Tubo EMT' },
  { value: 'PVC', label: 'Tubo PVC' },
  { value: 'bandeja', label: 'Bandeja Portacables' },
  { value: 'canaleta', label: 'Canaleta' },
  { value: 'liquidtight', label: 'Rollo Flexible Liquidtight' },
];

export default function EditProjectClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (res.ok) {
          const p = data?.project ?? {};
          setForm({
            nombre: p?.nombre ?? '',
            cliente: p?.cliente ?? '',
            clienteRNC: p?.clienteRNC ?? '',
            ubicacion: p?.ubicacion ?? '',
            modoAvanzado: p?.modoAvanzado ?? false,
            distanciaPromedio: p?.distanciaPromedio ?? 30,
            tipoInstalacion: p?.tipoInstalacion ?? 'expuesta',
            tipoCanalización: p?.tipoCanalización ?? 'EMT',
            categoriaCable: p?.categoriaCable ?? 'Cat6',
            reservaCable: p?.reservaCable ?? 15,
            reservaMateriales: p?.reservaMateriales ?? 10,
            switchPuertos: p?.switchPuertos ?? 24,
            switchPoE: p?.switchPoE ?? false,
            switchPuertosPoE: p?.switchPuertosPoE ?? 0,
            gabineteRU: p?.gabineteRU ?? 12,
            incluyeUPS: p?.incluyeUPS ?? false,
            notas: p?.notas ?? '',
            puntos: (p?.puntos ?? []).map((pt: any) => ({
              tipo: pt?.tipo ?? 'datos',
              cantidad: pt?.cantidad ?? 1,
              distancia: pt?.distancia ?? 30,
            })),
          });
        }
      } catch {
        toast.error('Error al cargar proyecto');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...(prev ?? {}), [field]: value }));
  };

  const addPunto = () => {
    setForm((prev: any) => ({
      ...(prev ?? {}),
      puntos: [...(prev?.puntos ?? []), { tipo: 'datos', cantidad: 1, distancia: prev?.distanciaPromedio ?? 30 }],
    }));
  };

  const removePunto = (index: number) => {
    setForm((prev: any) => ({
      ...(prev ?? {}),
      puntos: (prev?.puntos ?? []).filter((_: any, i: number) => i !== index),
    }));
  };

  const updatePunto = (index: number, field: string, value: any) => {
    setForm((prev: any) => {
      const puntos = [...(prev?.puntos ?? [])];
      if (puntos[index]) {
        puntos[index] = { ...(puntos[index] ?? {}), [field]: value };
      }
      return { ...(prev ?? {}), puntos };
    });
  };

  const handleSave = async (recalculate = true) => {
    if (!form?.nombre?.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recalculate }),
      });
      if (res.ok) {
        toast.success(recalculate ? 'Proyecto actualizado y recalculado' : 'Datos guardados');
        router.replace(`/proyecto/${projectId}`);
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Error al guardar');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <FadeIn>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/proyecto/${projectId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al proyecto
        </Button>
        <h1 className="text-2xl font-display font-bold tracking-tight mb-6">Editar Proyecto</h1>
      </FadeIn>

      {/* Info general */}
      <FadeIn delay={0.1}>
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Información General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form?.nombre ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('nombre', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input value={form?.cliente ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('cliente', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>RNC / Cédula del cliente</Label>
                <Input placeholder="Ej: 1-01-23456-7" value={form?.clienteRNC ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('clienteRNC', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={form?.ubicacion ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('ubicacion', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={form?.notas ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('notas', e.target.value)} rows={3} placeholder="Observaciones, alcance o detalles del proyecto (aparecen en los reportes)" />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Puntos */}
      <FadeIn delay={0.15}>
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Network className="w-5 h-5 text-primary" />Puntos de Red</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{form?.modoAvanzado ? 'Modo Avanzado' : 'Modo Simple'}</span>
              <button onClick={() => updateField('modoAvanzado', !form?.modoAvanzado)}>
                {form?.modoAvanzado ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-primary" />}
              </button>
            </div>
            {!form?.modoAvanzado && (
              <div className="space-y-2">
                <Label>Distancia promedio (m)</Label>
                <Input type="number" value={form?.distanciaPromedio ?? 30} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('distanciaPromedio', parseFloat(e.target.value) || 30)} />
              </div>
            )}
            <div className="space-y-3">
              {(form?.puntos ?? []).map((punto: any, index: number) => (
                <div key={index} className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={punto?.tipo ?? 'datos'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updatePunto(index, 'tipo', e.target.value)}>
                      {TIPOS_PUNTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" min={1} value={punto?.cantidad ?? 1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePunto(index, 'cantidad', parseInt(e.target.value) || 1)} />
                  </div>
                  {form?.modoAvanzado && (
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Distancia (m)</Label>
                      <Input type="number" min={1} value={punto?.distancia ?? 30} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePunto(index, 'distancia', parseFloat(e.target.value) || 30)} />
                    </div>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => removePunto(index)} className="text-destructive" disabled={(form?.puntos?.length ?? 0) <= 1}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addPunto} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Agregar punto
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Config técnica */}
      <FadeIn delay={0.2}>
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" />Configuración Técnica</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría de cable</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.categoriaCable ?? 'Cat6'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('categoriaCable', e.target.value)}>
                  <option value="Cat6">Cat6</option>
                  <option value="Cat6A">Cat6A</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Canalización</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.tipoCanalización ?? 'EMT'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('tipoCanalización', e.target.value)}>
                  {TIPOS_CANALIZACION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reserva cable (%)</Label>
                <Input type="number" value={form?.reservaCable ?? 15} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('reservaCable', parseFloat(e.target.value) || 15)} />
              </div>
              <div className="space-y-2">
                <Label>Reserva materiales (%)</Label>
                <Input type="number" value={form?.reservaMateriales ?? 10} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('reservaMateriales', parseFloat(e.target.value) || 10)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Equipos */}
      <FadeIn delay={0.25}>
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Server className="w-5 h-5 text-primary" />Equipos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puertos por switch</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.switchPuertos ?? 24} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('switchPuertos', parseInt(e.target.value) || 24)}>
                  <option value={8}>8</option><option value={16}>16</option><option value={24}>24</option><option value={48}>48</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Gabinete (RU)</Label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.gabineteRU ?? 12} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('gabineteRU', parseInt(e.target.value) || 12)}>
                  <option value={6}>6</option><option value={9}>9</option><option value={12}>12</option><option value={18}>18</option><option value={22}>22</option><option value={27}>27</option><option value={42}>42</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Switch PoE</span>
              <button onClick={() => updateField('switchPoE', !form?.switchPoE)}>
                {form?.switchPoE ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-primary" />}
              </button>
            </div>
            {form?.switchPoE && (
              <div className="space-y-2">
                <Label>Puertos PoE</Label>
                <Input type="number" min={0} value={form?.switchPuertosPoE ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('switchPuertosPoE', parseInt(e.target.value) || 0)} />
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Incluir UPS</span>
              <button onClick={() => updateField('incluyeUPS', !form?.incluyeUPS)}>
                {form?.incluyeUPS ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-primary" />}
              </button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push(`/proyecto/${projectId}`)}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> Solo guardar
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500">
          {saving ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar y Recalcular</>}
        </Button>
      </div>
    </div>
  );
}
