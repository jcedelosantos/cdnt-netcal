'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/animate';
import { Building2, Save, Upload, Trash2, Image as ImageIcon, CreditCard, CalendarClock, UserCog, Eye, EyeOff } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface EmpresaConfig {
  empresaNombre: string;
  empresaRNC: string;
  empresaTelefono: string;
  empresaDireccion: string;
  empresaEmail: string;
  empresaLogo: string;
  empresaBanco: string;
  empresaCuenta: string;
  empresaTipoCuenta: string;
  empresaNombreCuenta: string;
  validezCotizacion: number;
}

const VACIO: EmpresaConfig = {
  empresaNombre: '', empresaRNC: '', empresaTelefono: '',
  empresaDireccion: '', empresaEmail: '', empresaLogo: '',
  empresaBanco: '', empresaCuenta: '', empresaTipoCuenta: '', empresaNombreCuenta: '',
  validezCotizacion: 30,
};

export default function ConfigClient() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<EmpresaConfig>(VACIO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cuenta
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [passActual, setPassActual] = useState('');
  const [passNuevo, setPassNuevo] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [savingCuenta, setSavingCuenta] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracion');
      const data = await res.json();
      if (res.ok && data?.config) {
        setNombre(data.config.name ?? '');
        setEmail(data.config.email ?? '');
        setConfig({
          empresaNombre: data.config.empresaNombre ?? '',
          empresaRNC: data.config.empresaRNC ?? '',
          empresaTelefono: data.config.empresaTelefono ?? '',
          empresaDireccion: data.config.empresaDireccion ?? '',
          empresaEmail: data.config.empresaEmail ?? '',
          empresaLogo: data.config.empresaLogo ?? '',
          empresaBanco: data.config.empresaBanco ?? '',
          empresaCuenta: data.config.empresaCuenta ?? '',
          empresaTipoCuenta: data.config.empresaTipoCuenta ?? '',
          empresaNombreCuenta: data.config.empresaNombreCuenta ?? '',
          validezCotizacion: data.config.validezCotizacion ?? 30,
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

  const handleSaveCuenta = async () => {
    if (passNuevo && passNuevo !== passConfirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passNuevo && passNuevo.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingCuenta(true);
    try {
      const body: any = { name: nombre, email };
      if (passNuevo) { body.passwordActual = passActual; body.passwordNuevo = passNuevo; }
      const res = await fetch('/api/cuenta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d?.error ?? 'Error al guardar'); return; }
      toast.success('Cuenta actualizada');
      setPassActual(''); setPassNuevo(''); setPassConfirm('');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSavingCuenta(false);
    }
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
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" /> Cotizaciones
            </CardTitle>
            <CardDescription>Configuración general para cotizaciones generadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Validez de cotización (días)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  placeholder="30"
                  value={config.validezCotizacion}
                  onChange={(e) => setConfig((prev) => ({ ...prev, validezCotizacion: parseInt(e.target.value) || 30 }))}
                />
                <p className="text-xs text-muted-foreground">
                  La cotización mostrará "Válida hasta" sumando estos días a la fecha del proyecto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <UserCog className="w-4 h-4 text-primary" /> Mi cuenta
            </CardTitle>
            <CardDescription>Nombre, correo de acceso y contraseña</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <Label>Correo de acceso</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Cambiar contraseña <span className="text-muted-foreground font-normal">(opcional)</span></p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contraseña actual</Label>
                  <div className="relative">
                    <Input type={showPass ? 'text' : 'password'} value={passActual} onChange={(e) => setPassActual(e.target.value)} placeholder="••••••••" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contraseña nueva</Label>
                  <Input type={showPass ? 'text' : 'password'} value={passNuevo} onChange={(e) => setPassNuevo(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar nueva</Label>
                  <Input type={showPass ? 'text' : 'password'} value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveCuenta} disabled={savingCuenta} className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600">
                <Save className="w-4 h-4 mr-2" /> {savingCuenta ? 'Guardando...' : 'Guardar cuenta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Información bancaria
            </CardTitle>
            <CardDescription>Aparece en las cotizaciones PDF para facilitar el pago</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del titular de la cuenta</Label>
                <Input placeholder="Ej: Cedanet Solutions" value={config.empresaNombreCuenta} onChange={(e) => setField('empresaNombreCuenta', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número de cuenta</Label>
                <Input placeholder="Ej: 9603114302" value={config.empresaCuenta} onChange={(e) => setField('empresaCuenta', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <Input placeholder="Ej: Corriente" value={config.empresaTipoCuenta} onChange={(e) => setField('empresaTipoCuenta', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input placeholder="Ej: Banreservas" value={config.empresaBanco} onChange={(e) => setField('empresaBanco', e.target.value)} />
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

