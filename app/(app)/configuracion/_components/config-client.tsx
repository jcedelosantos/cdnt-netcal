'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/animate';
import { Building2, Save, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface EmpresaConfig {
  empresaNombre: string;
  empresaRNC: string;
  empresaTelefono: string;
  empresaDireccion: string;
  empresaEmail: string;
  empresaLogo: string;
}

const VACIO: EmpresaConfig = {
  empresaNombre: '', empresaRNC: '', empresaTelefono: '',
  empresaDireccion: '', empresaEmail: '', empresaLogo: '',
};

export default function ConfigClient() {
  const [config, setConfig] = useState<EmpresaConfig>(VACIO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracion');
      const data = await res.json();
      if (res.ok && data?.config) {
        setConfig({
          empresaNombre: data.config.empresaNombre ?? '',
          empresaRNC: data.config.empresaRNC ?? '',
          empresaTelefono: data.config.empresaTelefono ?? '',
          empresaDireccion: data.config.empresaDireccion ?? '',
          empresaEmail: data.config.empresaEmail ?? '',
          empresaLogo: data.config.empresaLogo ?? '',
        });
      }
    } catch {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const setField = (field: keyof EmpresaConfig, value: string) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('El logo debe ser una imagen');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('El logo no debe superar 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('empresaLogo', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? 'Error al guardar');
        return;
      }
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Configuración de Empresa
          </h1>
          <p className="text-muted-foreground mt-1">
            Estos datos aparecerán como membrete en tus reportes y cotizaciones (PDF, Word, Excel).
          </p>
        </div>
      </FadeIn>

      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Datos de la empresa</CardTitle>
            <CardDescription>Información que identifica a tu empresa en los documentos exportados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                  {config.empresaLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={config.empresaLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md border border-input bg-background hover:bg-muted cursor-pointer">
                      <Upload className="w-4 h-4" /> Subir logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    {config.empresaLogo && (
                      <Button variant="ghost" size="sm" onClick={() => setField('empresaLogo', '')} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-1" /> Quitar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG o JPG, máx. 500 KB.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de la empresa</Label>
                <Input placeholder="Ej: Redes y Soluciones SRL" value={config.empresaNombre} onChange={(e) => setField('empresaNombre', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>RNC / Cédula</Label>
                <Input placeholder="Ej: 1-31-12345-6" value={config.empresaRNC} onChange={(e) => setField('empresaRNC', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="Ej: 809-000-0000" value={config.empresaTelefono} onChange={(e) => setField('empresaTelefono', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input placeholder="contacto@empresa.com" value={config.empresaEmail} onChange={(e) => setField('empresaEmail', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Dirección</Label>
                <Input placeholder="Calle, sector, ciudad" value={config.empresaDireccion} onChange={(e) => setField('empresaDireccion', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
