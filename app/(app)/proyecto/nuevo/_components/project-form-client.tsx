'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/animate';
import {
  Network, Building2, MapPin, Calendar, Cable, Settings2,
  Plus, Trash2, ChevronRight, ChevronLeft, Save, Calculator,
  Server, Shield, Zap, ToggleLeft, ToggleRight, Wifi,
  Camera, Phone, Monitor, Radio, AlertTriangle,
} from 'lucide-react';

const TIPOS_PUNTO = [
  { value: 'datos', label: 'Datos', icon: Monitor, color: 'bg-blue-100 text-blue-600' },
  { value: 'voz', label: 'Voz', icon: Phone, color: 'bg-green-100 text-green-600' },
  { value: 'datos_voz', label: 'Datos + Voz', icon: Cable, color: 'bg-purple-100 text-purple-600' },
  { value: 'camara_ip', label: 'Cámara IP', icon: Camera, color: 'bg-red-100 text-red-600' },
  { value: 'access_point', label: 'Access Point', icon: Wifi, color: 'bg-orange-100 text-orange-600' },
  { value: 'telefono_ip', label: 'Teléfono IP', icon: Radio, color: 'bg-teal-100 text-teal-600' },
];

const TIPOS_INSTALACION = [
  { value: 'expuesta', label: 'Expuesta' },
  { value: 'empotrada', label: 'Empotrada' },
  { value: 'mixta', label: 'Mixta' },
];

const TIPOS_CANALIZACION = [
  { value: 'MT', label: 'Tubo Metálico (MT)' },
  { value: 'EMT', label: 'Tubo EMT' },
  { value: 'PVC', label: 'Tubo PVC' },
  { value: 'bandeja', label: 'Bandeja Portacables' },
  { value: 'canaleta', label: 'Canaleta' },
  { value: 'liquidtight', label: 'Rollo Flexible Liquidtight' },
];

interface PuntoForm {
  tipo: string;
  cantidad: number;
  distancia: number;
}

interface ProjectForm {
  nombre: string;
  cliente: string;
  clienteRNC: string;
  ubicacion: string;
  fecha: string;
  modoAvanzado: boolean;
  distanciaPromedio: number;
  tipoInstalacion: string;
  tipoCanalización: string;
  categoriaCable: string;
  reservaCable: number;
  reservaMateriales: number;
  switchPuertos: number;
  switchPoE: boolean;
  switchPuertosPoE: number;
  gabineteRU: number;
  incluyeUPS: boolean;
  notas: string;
  puntos: PuntoForm[];
}

export default function ProjectFormClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<ProjectForm>({
    nombre: '',
    cliente: '',
    clienteRNC: '',
    ubicacion: '',
    fecha: today,
    modoAvanzado: false,
    distanciaPromedio: 30,
    tipoInstalacion: 'expuesta',
    tipoCanalización: 'EMT',
    categoriaCable: 'Cat6',
    reservaCable: 15,
    reservaMateriales: 10,
    switchPuertos: 24,
    switchPoE: false,
    switchPuertosPoE: 0,
    gabineteRU: 12,
    incluyeUPS: false,
    notas: '',
    puntos: [{ tipo: 'datos', cantidad: 10, distancia: 30 }],
  });

  const updateField = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...(prev ?? {}), [field]: value }));
  }, []);

  const addPunto = useCallback(() => {
    setForm((prev) => ({
      ...(prev ?? {}),
      puntos: [...(prev?.puntos ?? []), { tipo: 'datos', cantidad: 1, distancia: prev?.distanciaPromedio ?? 30 }],
    }));
  }, []);

  const removePunto = useCallback((index: number) => {
    setForm((prev) => ({
      ...(prev ?? {}),
      puntos: (prev?.puntos ?? []).filter((_: any, i: number) => i !== index),
    }));
  }, []);

  const updatePunto = useCallback((index: number, field: string, value: any) => {
    setForm((prev) => {
      const puntos = [...(prev?.puntos ?? [])];
      if (puntos[index]) {
        puntos[index] = { ...(puntos[index] ?? {}), [field]: value } as PuntoForm;
      }
      return { ...(prev ?? {}), puntos };
    });
  }, []);

  // Validación por paso antes de avanzar
  const validateStep = (s: number): boolean => {
    if (s === 0 && !form?.nombre?.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return false;
    }
    if (s === 1) {
      if ((form?.puntos?.length ?? 0) === 0) {
        toast.error('Agregue al menos un tipo de punto');
        return false;
      }
      if (!form?.modoAvanzado && (!form?.distanciaPromedio || form.distanciaPromedio <= 0)) {
        toast.error('Indique una distancia promedio válida');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(Math.min(steps.length - 1, step + 1));
  };

  // Puntos que exceden 90m (norma TIA/EIA-568) en modo avanzado
  const puntosExcedidos = form?.modoAvanzado
    ? (form?.puntos ?? []).filter((p) => (p?.distancia ?? 0) > 90).length
    : 0;

  // Recomendación de gabinete según total de puntos activos
  const totalPuntosActivos = (form?.puntos ?? []).reduce((acc, p) => {
    const mult = p?.tipo === 'datos_voz' ? 2 : 1;
    return acc + (p?.cantidad ?? 0) * mult;
  }, 0);
  // Dispositivos que necesitan PoE: cámara IP, access point, teléfono IP
  const puntosPoENecesarios = (form?.puntos ?? [])
    .filter((p) => ['camara_ip', 'access_point', 'telefono_ip'].includes(p?.tipo ?? ''))
    .reduce((acc, p) => acc + (p?.cantidad ?? 0), 0);

  const gabineteRecomendado = totalPuntosActivos <= 12 ? 6
    : totalPuntosActivos <= 24 ? 9
    : totalPuntosActivos <= 48 ? 12
    : totalPuntosActivos <= 96 ? 18
    : 22;

  const handleSubmit = async () => {
    if (!form?.nombre?.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }
    if ((form?.puntos?.length ?? 0) === 0) {
      toast.error('Debe agregar al menos un tipo de punto');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Error al crear proyecto');
        return;
      }
      toast.success('Proyecto creado exitosamente');
      router.replace(`/proyecto/${data?.project?.id}`);
    } catch {
      toast.error('Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Información General', icon: Building2 },
    { title: 'Puntos de Red', icon: Network },
    { title: 'Configuración Técnica', icon: Settings2 },
    { title: 'Equipos', icon: Server },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Nuevo Proyecto
          </h1>
          <p className="text-muted-foreground mt-1">Complete los datos para calcular los materiales necesarios.</p>
        </div>
      </FadeIn>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                step === i
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Step 0: Info General */}
      {step === 0 && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Building2 className="w-5 h-5 text-primary" />
                Información General
              </CardTitle>
              <CardDescription>Datos básicos del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del proyecto *</Label>
                  <Input placeholder="Ej: Oficina Central" value={form?.nombre ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('nombre', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input placeholder="Nombre del cliente" value={form?.cliente ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('cliente', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>RNC / Cédula del cliente</Label>
                <Input placeholder="Ej: 1-01-23456-7" value={form?.clienteRNC ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('clienteRNC', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Dirección o ubicación del proyecto" value={form?.ubicacion ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('ubicacion', e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha del proyecto</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="date" value={form?.fecha ?? today} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('fecha', e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea placeholder="Observaciones, alcance o detalles del proyecto (aparecen en los reportes)" value={form?.notas ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('notas', e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Step 1: Puntos */}
      {step === 1 && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Network className="w-5 h-5 text-primary" />
                Puntos de Red
              </CardTitle>
              <CardDescription>Defina los tipos y cantidades de puntos del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Modo toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Modo de distancia</p>
                  <p className="text-xs text-muted-foreground">
                    {form?.modoAvanzado ? 'Distancia individual por punto' : 'Distancia promedio para todos'}
                  </p>
                </div>
                <button onClick={() => updateField('modoAvanzado', !form?.modoAvanzado)} className="flex items-center gap-2 text-primary">
                  {form?.modoAvanzado ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* Distancia promedio (modo simple) */}
              {!form?.modoAvanzado && (
                <div className="space-y-2">
                  <Label>Distancia promedio (metros)</Label>
                  <Input type="number" min={1} max={100} value={form?.distanciaPromedio ?? 30} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('distanciaPromedio', parseFloat(e.target.value) || 30)} />
                </div>
              )}

              {/* Puntos list */}
              <div className="space-y-3">
                {(form?.puntos ?? []).map((punto: PuntoForm, index: number) => {
                  const tipoInfo = TIPOS_PUNTO.find((t) => t.value === punto?.tipo) ?? TIPOS_PUNTO[0];
                  const Icon = tipoInfo?.icon ?? Monitor;
                  return (
                    <div key={index} className="flex flex-wrap items-end gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex-1 min-w-[140px] space-y-1">
                        <Label className="text-xs">Tipo de punto</Label>
                        <select
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                          value={punto?.tipo ?? 'datos'}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updatePunto(index, 'tipo', e.target.value)}
                        >
                          {TIPOS_PUNTO.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Cantidad</Label>
                        <Input type="number" min={1} value={punto?.cantidad ?? 1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePunto(index, 'cantidad', parseInt(e.target.value) || 1)} />
                      </div>
                      {form?.modoAvanzado && (
                        <div className="w-28 space-y-1">
                          <Label className="text-xs">Distancia (m)</Label>
                          <Input
                            type="number" min={1} max={100}
                            className={(punto?.distancia ?? 0) > 90 ? 'border-destructive focus-visible:ring-destructive' : ''}
                            value={punto?.distancia ?? 30}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePunto(index, 'distancia', parseFloat(e.target.value) || 30)}
                          />
                          {(punto?.distancia ?? 0) > 90 && (
                            <p className="text-[10px] text-destructive flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Excede 90m (TIA/EIA-568)
                            </p>
                          )}
                        </div>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removePunto(index)} className="text-destructive hover:bg-destructive/10" disabled={(form?.puntos?.length ?? 0) <= 1}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" onClick={addPunto} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Agregar tipo de punto
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Step 2: Config Técnica */}
      {step === 2 && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Settings2 className="w-5 h-5 text-primary" />
                Configuración Técnica
              </CardTitle>
              <CardDescription>Parámetros de cable y canalización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría de cable</Label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.categoriaCable ?? 'Cat6'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('categoriaCable', e.target.value)}>
                    <option value="Cat6">Cat6</option>
                    <option value="Cat6A">Cat6A</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de instalación</Label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.tipoInstalacion ?? 'expuesta'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('tipoInstalacion', e.target.value)}>
                    {TIPOS_INSTALACION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de canalización</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIPOS_CANALIZACION.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateField('tipoCanalización', t.value)}
                      className={`p-3 rounded-lg text-sm font-medium border transition-colors ${
                        form?.tipoCanalización === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 text-muted-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reserva de cable (%)</Label>
                  <Input type="number" min={0} max={50} value={form?.reservaCable ?? 15} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('reservaCable', parseFloat(e.target.value) || 15)} />
                </div>
                <div className="space-y-2">
                  <Label>Reserva de materiales menores (%)</Label>
                  <Input type="number" min={0} max={50} value={form?.reservaMateriales ?? 10} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('reservaMateriales', parseFloat(e.target.value) || 10)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Step 3: Equipos */}
      {step === 3 && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Server className="w-5 h-5 text-primary" />
                Equipos
              </CardTitle>
              <CardDescription>Configuración de switches, gabinete y protección</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Switch */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                <h3 className="font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Switch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Puertos totales por switch</Label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.switchPuertos ?? 24} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('switchPuertos', parseInt(e.target.value) || 24)}>
                      <option value={8}>8 puertos</option>
                      <option value={16}>16 puertos</option>
                      <option value={24}>24 puertos</option>
                      <option value={48}>48 puertos</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Puertos PoE</Label>
                      <button onClick={() => updateField('switchPoE', !form?.switchPoE)} className="text-primary">
                        {form?.switchPoE ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                      </button>
                    </div>
                    {!form?.switchPoE && puntosPoENecesarios > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3" /> {puntosPoENecesarios} dispositivo{puntosPoENecesarios !== 1 ? 's' : ''} requieren PoE — active la opción
                      </p>
                    )}
                    {form?.switchPoE && (
                      <>
                        <Input type="number" min={0} placeholder="Cantidad de puertos PoE" value={form?.switchPuertosPoE ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('switchPuertosPoE', parseInt(e.target.value) || 0)} />
                        {puntosPoENecesarios > 0 && (
                          <p className={`text-xs flex items-center gap-1 mt-1 ${(form?.switchPuertosPoE ?? 0) < puntosPoENecesarios ? 'text-amber-600' : 'text-green-600'}`}>
                            <Zap className="w-3 h-3" />
                            {puntosPoENecesarios} puerto{puntosPoENecesarios !== 1 ? 's' : ''} PoE requerido{puntosPoENecesarios !== 1 ? 's' : ''}
                            {(form?.switchPuertosPoE ?? 0) < puntosPoENecesarios && ' — configure al menos esa cantidad'}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Gabinete */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                <h3 className="font-medium flex items-center gap-2"><Server className="w-4 h-4 text-primary" /> Gabinete/Rack</h3>
                <div className="space-y-2">
                  <Label>Unidades de rack (RU)</Label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form?.gabineteRU ?? 12} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('gabineteRU', parseInt(e.target.value) || 12)}>
                    <option value={6}>6 RU</option>
                    <option value={9}>9 RU</option>
                    <option value={12}>12 RU</option>
                    <option value={18}>18 RU</option>
                    <option value={22}>22 RU</option>
                    <option value={27}>27 RU</option>
                    <option value={42}>42 RU</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Recomendado para {totalPuntosActivos} puntos activos:{' '}
                    <span className="font-medium text-primary">{gabineteRecomendado} RU</span>
                    {(form?.gabineteRU ?? 12) < gabineteRecomendado && (
                      <span className="text-destructive"> — el seleccionado puede quedar pequeño</span>
                    )}
                  </p>
                </div>
              </div>

              {/* UPS */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Incluir UPS</p>
                    <p className="text-xs text-muted-foreground">Protección eléctrica para los equipos</p>
                  </div>
                </div>
                <button onClick={() => updateField('incluyeUPS', !form?.incluyeUPS)} className="text-primary">
                  {form?.incluyeUPS ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={goNext}>
            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600">
            {loading ? 'Calculando...' : (
              <><Calculator className="w-4 h-4 mr-2" /> Calcular Materiales</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
