'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeIn, SlideIn } from '@/components/ui/animate';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Network, Cable, Server, Shield, Tag, Wrench, Zap,
  AlertTriangle, CheckCircle, Info, XCircle, ArrowLeft,
  Download, Copy, Trash2, Edit, Camera, DollarSign,
  ToggleLeft, ToggleRight, FileText, FileSpreadsheet, FileDown, FileType2, Save, Clock, Mail,
  Plus, PackagePlus,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportarPDF, exportarExcel, exportarWord, type ExportData } from '@/lib/exporters';

const CATEGORIA_ICONS: Record<string, any> = {
  'Cableado Estructurado': Cable,
  'Gabinete/Rack': Server,
  'Canalización': Wrench,
  'CCTV': Camera,
  'Electricidad/Protección': Zap,
  'Identificación': Tag,
  'Consumibles': Shield,
};

const CATEGORIA_COLORS: Record<string, string> = {
  'Cableado Estructurado': 'bg-blue-100 text-blue-600',
  'Gabinete/Rack': 'bg-purple-100 text-purple-600',
  'Canalización': 'bg-orange-100 text-orange-600',
  'CCTV': 'bg-red-100 text-red-600',
  'Electricidad/Protección': 'bg-yellow-100 text-yellow-600',
  'Identificación': 'bg-teal-100 text-teal-600',
  'Consumibles': 'bg-gray-100 text-gray-600',
};

const ALERTA_ICONS: Record<string, any> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const ALERTA_COLORS: Record<string, string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
};

interface Props {
  projectId: string;
}

const fmtFecha = (iso?: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function ProjectDetailClient({ projectId }: Props) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [empresa, setEmpresa] = useState<any>(null);
  const [moneda, setMoneda] = useState<string>('DOP');
  const [tasaDolar, setTasaDolar] = useState<number>(60);
  const [cotizacion, setCotizacion] = useState({
    itbis: 18, margenGanancia: 0, costoManoObra: 0,
    costoTransporte: 0, costoConfiguracion: 0, costoCertificacion: 0,
  });
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ categoria: 'Adicionales', nombre: '', cantidad: 1, unidad: 'und', precioUnit: 0 });
  const [savingMaterial, setSavingMaterial] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Error al cargar proyecto');
        return;
      }
      setProject(data?.project);
      setResultado(data?.resultado);
      // Cargar parámetros de cotización guardados
      const p = data?.project ?? {};
      setMoneda(p?.moneda ?? 'DOP');
      setCotizacion({
        itbis: p?.itbis ?? 18,
        margenGanancia: p?.margenGanancia ?? 0,
        costoManoObra: p?.costoManoObra ?? 0,
        costoTransporte: p?.costoTransporte ?? 0,
        costoConfiguracion: p?.costoConfiguracion ?? 0,
        costoCertificacion: p?.costoCertificacion ?? 0,
      });
      // Init prices from stored materials
      const storedPrices: Record<string, number> = {};
      for (const m of (data?.project?.materiales ?? [])) {
        if (m?.id && (m?.precioUnit ?? 0) > 0) {
          storedPrices[m.id] = m.precioUnit;
        }
      }
      if (Object.keys(storedPrices).length > 0 || p?.incluyeCotizacion) {
        setPrices(storedPrices);
        setShowPrices(true);
      }
    } catch {
      toast.error('Error al cargar proyecto');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    // Cargar configuración de empresa para el membrete de los reportes
    fetch('/api/configuracion')
      .then((r) => r.json())
      .then((d) => setEmpresa(d?.config ?? null))
      .catch(() => {});
  }, [fetchProject]);

  const handleAddMaterial = async () => {
    if (!newMaterial.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setSavingMaterial(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/materiales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Error al agregar material'); return; }
      toast.success('Material agregado');
      setShowAddMaterial(false);
      setNewMaterial({ categoria: 'Adicionales', nombre: '', cantidad: 1, unidad: 'und', precioUnit: 0 });
      fetchProject();
    } catch {
      toast.error('Error al agregar material');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('¿Eliminar este material adicional?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/materiales/${materialId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Material eliminado');
      fetchProject();
    } catch {
      toast.error('Error al eliminar material');
    }
  };

  const handleToggleAprobado = async () => {
    const nuevo = !project?.aprobado;
    setProject((prev: any) => ({ ...(prev ?? {}), aprobado: nuevo }));
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado: nuevo }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json().catch(() => ({}));
      setProject((prev: any) => ({ ...(prev ?? {}), aprobado: nuevo, aprobadoEn: d?.aprobadoEn ?? null }));
      toast.success(nuevo ? 'Proyecto aprobado' : 'Aprobación retirada');
    } catch {
      setProject((prev: any) => ({ ...(prev ?? {}), aprobado: !nuevo }));
      toast.error('Error al actualizar estado');
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Proyecto duplicado');
        router.push(`/proyecto/${data?.id}`);
      }
    } catch {
      toast.error('Error al duplicar');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro que desea eliminar este proyecto?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Proyecto eliminado');
        router.replace('/proyectos');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleExportCSV = () => {
    const materiales = resultado?.materiales ?? [];
    const header = 'Categoría,Material,Cantidad,Unidad,Precio Unitario,Subtotal\n';
    const rows = materiales.map((m: any) => {
      const price = prices[findMaterialId(m)] ?? m?.precioUnit ?? 0;
      return `"${m?.categoria ?? ''}","${m?.nombre ?? ''}",${m?.cantidad ?? 0},"${m?.unidad ?? ''}",${price},${(m?.cantidad ?? 0) * price}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.nombre ?? 'proyecto'}_materiales.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildExportData = (): ExportData => {
    const materiales = resultado?.materiales ?? [];
    const resumen = resultado?.resumen ?? {};
    // Agrupar por categoría preservando el orden de aparición
    const orden: string[] = [];
    const grupos: Record<string, any[]> = {};
    for (const m of materiales) {
      const cat = m?.categoria ?? 'Otros';
      if (!grupos[cat]) { grupos[cat] = []; orden.push(cat); }
      const price = prices[findMaterialId(m)] ?? 0;
      grupos[cat].push({
        nombre: m?.nombre ?? '',
        cantidad: m?.cantidad ?? 0,
        unidad: m?.unidad ?? 'und',
        precioUnit: price,
        subtotal: (m?.cantidad ?? 0) * price,
      });
    }
    const t = showPrices ? calcularTotalesCotizacion() : null;
    return {
      moneda,
      empresa: empresa
        ? {
            nombre: empresa?.empresaNombre ?? undefined,
            rnc: empresa?.empresaRNC ?? undefined,
            telefono: empresa?.empresaTelefono ?? undefined,
            direccion: empresa?.empresaDireccion ?? undefined,
            email: empresa?.empresaEmail ?? undefined,
            logo: empresa?.empresaLogo ?? undefined,
          }
        : undefined,
      project: {
        nombre: project?.nombre ?? 'Proyecto',
        cliente: project?.cliente ?? undefined,
        ubicacion: project?.ubicacion ?? undefined,
        categoriaCable: project?.categoriaCable ?? 'Cat6',
        fecha: project?.fecha ?? undefined,
        notas: project?.notas ?? undefined,
        aprobado: !!project?.aprobado,
      },
      resumen: {
        totalPuntos: resumen?.totalPuntos ?? 0,
        totalCajas: resumen?.totalCajas ?? 0,
        totalCableMetros: resumen?.totalCableMetros ?? 0,
        puntosPoE: resumen?.puntosPoE ?? 0,
      },
      categorias: orden.map((nombre) => ({ nombre, items: grupos[nombre] })),
      showPrices,
      totales: t
        ? {
            subtotalMateriales: t.subtotalMateriales,
            margen: t.margen,
            margenPct: cotizacion?.margenGanancia ?? 0,
            costoManoObra: cotizacion?.costoManoObra ?? 0,
            costoTransporte: cotizacion?.costoTransporte ?? 0,
            costoConfiguracion: cotizacion?.costoConfiguracion ?? 0,
            costoCertificacion: cotizacion?.costoCertificacion ?? 0,
            subtotalGeneral: t.subtotalGeneral,
            itbisPct: cotizacion?.itbis ?? 18,
            itbisValor: t.itbisValor,
            total: t.total,
          }
        : null,
    };
  };

  const handleSavePrices = async () => {
    setSaving(true);
    try {
      // Construir lista de materiales con id + precio actual
      const materialesPayload = (resultado?.materiales ?? []).map((m: any) => {
        const id = findMaterialId(m);
        return { id, cantidad: m?.cantidad ?? 0, precioUnit: prices[id] ?? 0 };
      }).filter((m: any) => m.id);
      const res = await fetch(`/api/projects/${projectId}/materiales`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materiales: materialesPayload,
          cotizacion: { ...cotizacion, moneda, incluyeCotizacion: true },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? 'Error al guardar precios');
        return;
      }
      toast.success('Precios y cotización guardados');
    } catch {
      toast.error('Error al guardar precios');
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarCorreo = () => {
    const t = showPrices ? calcularTotalesCotizacion() : null;
    const sim = moneda === 'USD' ? 'US$' : 'RD$';
    const res = resultado?.resumen ?? {};
    const lineas: string[] = [];
    lineas.push(`Estimado/a ${project?.cliente ?? 'cliente'},`);
    lineas.push('');
    lineas.push(`A continuación le compartimos la ${showPrices ? 'cotización' : 'lista de materiales'} del proyecto "${project?.nombre ?? ''}".`);
    lineas.push('');
    lineas.push(`Resumen técnico:`);
    lineas.push(`• Puntos: ${res?.totalPuntos ?? 0}`);
    lineas.push(`• Cable estimado: ${Math.round(res?.totalCableMetros ?? 0)} m`);
    lineas.push(`• Cajas de cable: ${res?.totalCajas ?? 0}`);
    if (t) {
      lineas.push('');
      lineas.push(`TOTAL: ${sim} ${t.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`);
    }
    lineas.push('');
    lineas.push('Adjunto encontrará el documento en PDF con el detalle completo.');
    lineas.push('');
    lineas.push('Saludos cordiales,');
    if (empresa?.empresaNombre) lineas.push(empresa.empresaNombre);
    if (empresa?.empresaTelefono) lineas.push(`Tel: ${empresa.empresaTelefono}`);

    const asunto = `${showPrices ? 'Cotización' : 'Materiales'} - ${project?.nombre ?? 'Proyecto'}`;
    const mailto = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(lineas.join('\n'))}`;
    window.location.href = mailto;
    toast.info('Abriendo tu cliente de correo. Recuerda adjuntar el PDF exportado.');
  };

  const handleExport = async (formato: 'pdf' | 'excel' | 'word') => {
    try {
      const data = buildExportData();
      if (formato === 'pdf') await exportarPDF(data);
      else if (formato === 'excel') await exportarExcel(data);
      else await exportarWord(data);
      toast.success(`Exportado a ${formato.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Error al exportar a ${formato.toUpperCase()}`);
    }
  };

  const findMaterialId = (material: any): string => {
    const stored = (project?.materiales ?? []).find((m: any) =>
      m?.nombre === material?.nombre && m?.categoria === material?.categoria
    );
    return stored?.id ?? '';
  };

  const calcularTotalesCotizacion = () => {
    const materiales = resultado?.materiales ?? [];
    const subtotalCalculados = materiales.reduce((acc: number, m: any) => {
      const id = findMaterialId(m);
      const price = prices[id] ?? 0;
      return acc + (m?.cantidad ?? 0) * price;
    }, 0);
    // Sumar materiales personalizados (tienen precio propio guardado en DB)
    const subtotalPersonalizados = (project?.materiales ?? [])
      .filter((m: any) => m?.esPersonalizado)
      .reduce((acc: number, m: any) => acc + ((m?.cantidad ?? 0) * (m?.precioUnit ?? 0)), 0);
    const subtotalMateriales = subtotalCalculados + subtotalPersonalizados;
    const margen = subtotalMateriales * ((cotizacion?.margenGanancia ?? 0) / 100);
    const costosAdicionales = (cotizacion?.costoManoObra ?? 0) + (cotizacion?.costoTransporte ?? 0) + (cotizacion?.costoConfiguracion ?? 0) + (cotizacion?.costoCertificacion ?? 0);
    const subtotalGeneral = subtotalMateriales + margen + costosAdicionales;
    const itbisValor = subtotalGeneral * ((cotizacion?.itbis ?? 18) / 100);
    return {
      subtotalMateriales: Math.round(subtotalMateriales * 100) / 100,
      margen: Math.round(margen * 100) / 100,
      costosAdicionales: Math.round(costosAdicionales * 100) / 100,
      subtotalGeneral: Math.round(subtotalGeneral * 100) / 100,
      itbisValor: Math.round(itbisValor * 100) / 100,
      total: Math.round((subtotalGeneral + itbisValor) * 100) / 100,
    };
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <Button variant="outline" onClick={() => router.push('/proyectos')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const resumen = resultado?.resumen ?? {};
  const alertas = resultado?.alertas ?? [];
  const materiales = resultado?.materiales ?? [];

  // Group by category — incluir materiales personalizados del proyecto
  const categorias: Record<string, any[]> = {};
  for (const m of materiales) {
    const cat = m?.categoria ?? 'Otros';
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push({ ...m, esPersonalizado: false });
  }
  for (const m of (project?.materiales ?? [])) {
    if (!m?.esPersonalizado) continue;
    const cat = m?.categoria ?? 'Adicionales';
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(m);
  }

  const totalesCot = showPrices ? calcularTotalesCotizacion() : null;
  const simbolo = moneda === 'USD' ? 'US$' : 'RD$';
  const tasa = (tasaDolar > 0 ? tasaDolar : 1);
  const conv = (monto: number) => moneda === 'USD' ? monto / tasa : monto;
  const fmtMonto = (monto: number) => `${simbolo} ${conv(monto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/proyectos')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Proyectos
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-display font-bold tracking-tight">{project?.nombre ?? 'Proyecto'}</h1>
              {project?.aprobado ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="w-3.5 h-3.5" /> Aprobado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Pendiente
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {project?.cliente ?? ''}{project?.cliente && project?.ubicacion ? ' • ' : ''}{project?.ubicacion ?? ''}
              {' • '}{project?.categoriaCable ?? 'Cat6'}
            </p>
            {project?.aprobado && project?.aprobadoEn && (
              <p className="text-xs text-green-600 mt-0.5">Aprobado el {fmtFecha(project.aprobadoEn)}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={project?.aprobado ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleAprobado}
              className={project?.aprobado ? 'text-green-700 border-green-300 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700'}
            >
              <CheckCircle className="w-4 h-4 mr-1" /> {project?.aprobado ? 'Aprobado' : 'Aprobar'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-1" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="w-4 h-4 mr-2 text-red-600" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('word')}>
                  <FileType2 className="w-4 h-4 mr-2 text-blue-600" /> Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2 text-gray-600" /> CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleEnviarCorreo}>
              <Mail className="w-4 h-4 mr-1" /> Enviar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-1" /> Duplicar
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/proyecto/${projectId}/editar`)}>
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Puntos totales', value: resumen?.totalPuntos ?? 0, icon: Network, color: 'bg-blue-100 text-blue-600' },
          { label: 'Cajas de cable', value: resumen?.totalCajas ?? 0, icon: Cable, color: 'bg-teal-100 text-teal-600' },
          { label: 'Cable (metros)', value: Math.round(resumen?.totalCableMetros ?? 0), icon: Cable, color: 'bg-purple-100 text-purple-600' },
          { label: 'Puntos PoE', value: resumen?.puntosPoE ?? 0, icon: Zap, color: 'bg-orange-100 text-orange-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <SlideIn key={i} from="bottom" delay={i * 0.1}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xl font-mono font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SlideIn>
          );
        })}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <FadeIn delay={0.2}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Alertas y Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alertas.map((a: any, i: number) => {
                const Icon = ALERTA_ICONS[a?.tipo] ?? Info;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${ALERTA_COLORS[a?.tipo] ?? ALERTA_COLORS.info}`}>
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{a?.mensaje ?? ''}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Toggle cotización */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold">Listado de Materiales</h2>
        <div className="flex items-center gap-3">
          {showPrices && (
            <Button variant="default" size="sm" onClick={handleSavePrices} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAddMaterial((v) => !v)}>
            <PackagePlus className="w-4 h-4 mr-1" /> Agregar material
          </Button>
          <button onClick={() => setShowPrices(!showPrices)} className="flex items-center gap-2 text-sm font-medium text-primary">
            <DollarSign className="w-4 h-4" />
            {showPrices ? 'Ocultar precios' : 'Agregar precios'}
            {showPrices ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Formulario agregar material */}
      {showAddMaterial && (
        <FadeIn>
          <Card className="mb-4 border-dashed border-primary/40 bg-primary/5">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Nuevo material adicional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Nombre *</label>
                  <Input placeholder="Ej: Caja de paso 4x4" value={newMaterial.nombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaterial((p) => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Categoría</label>
                  <Input placeholder="Adicionales" value={newMaterial.categoria}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaterial((p) => ({ ...p, categoria: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Cantidad</label>
                  <Input type="number" min={1} value={newMaterial.cantidad}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaterial((p) => ({ ...p, cantidad: parseFloat(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Unidad</label>
                  <Input placeholder="und" value={newMaterial.unidad}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaterial((p) => ({ ...p, unidad: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Precio unit.</label>
                  <Input type="number" min={0} step={0.01} placeholder="0.00" value={newMaterial.precioUnit || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMaterial((p) => ({ ...p, precioUnit: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={handleAddMaterial} disabled={savingMaterial}>
                  <Plus className="w-4 h-4 mr-1" /> {savingMaterial ? 'Guardando...' : 'Agregar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddMaterial(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Materiales por categoría */}
      {Object.entries(categorias).map(([cat, items], ci) => {
        const CatIcon = CATEGORIA_ICONS[cat] ?? Wrench;
        const catColor = CATEGORIA_COLORS[cat] ?? 'bg-gray-100 text-gray-600';
        return (
          <FadeIn key={cat} delay={0.1 * ci}>
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${catColor}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  {cat}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Material</TableHead>
                        <TableHead className="text-center w-24">Cantidad</TableHead>
                        <TableHead className="text-center w-20">Unidad</TableHead>
                        {showPrices && (
                          <>
                            <TableHead className="text-center w-32">Precio Unit.</TableHead>
                            <TableHead className="text-right w-32 pr-6">Subtotal</TableHead>
                          </>
                        )}
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(items ?? []).map((m: any, mi: number) => {
                        const materialId = findMaterialId(m);
                        const isCustom = !!m?.esPersonalizado;
                        const price = isCustom ? (m?.precioUnit ?? 0) : (prices[materialId] ?? 0);
                        const subtotal = (m?.cantidad ?? 0) * price;
                        return (
                          <TableRow key={mi} className={isCustom ? 'bg-primary/5' : ''}>
                            <TableCell className="pl-6 font-medium">
                              <span className="flex items-center gap-2">
                                {m?.nombre ?? ''}
                                {isCustom && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">Adicional</span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono">{m?.cantidad ?? 0}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{m?.unidad ?? 'und'}</TableCell>
                            {showPrices && (
                              <>
                                <TableCell className="text-center">
                                  {isCustom ? (
                                    <span className="font-mono text-sm">
                                      {price > 0 ? `${simbolo} ${price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-'}
                                    </span>
                                  ) : (
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      className="w-28 h-8 text-right mx-auto"
                                      value={price || ''}
                                      placeholder="0.00"
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setPrices((prev) => ({ ...(prev ?? {}), [materialId]: val }));
                                      }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono pr-6">
                                  {subtotal > 0 ? `${simbolo} ${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-'}
                                </TableCell>
                              </>
                            )}
                            <TableCell className="text-center w-10 pr-4">
                              {isCustom && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteMaterial(m.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        );
      })}

      {/* Cotización */}
      {showPrices && (
        <FadeIn>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Resumen de Cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Moneda</label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    value={moneda}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMoneda(e.target.value)}
                  >
                    <option value="DOP">Peso dominicano (RD$)</option>
                    <option value="USD">Dólar estadounidense (US$)</option>
                  </select>
                </div>
                {moneda === 'USD' && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tasa del dólar (RD$ por US$1)</label>
                    <Input
                      type="number" min={1} step={0.01}
                      value={tasaDolar}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTasaDolar(parseFloat(e.target.value) || 60)}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Margen de ganancia (%)</label>
                  <Input type="number" min={0} value={cotizacion?.margenGanancia ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotizacion((p) => ({ ...(p ?? {}), margenGanancia: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Mano de obra ({simbolo})</label>
                  <Input type="number" min={0} value={cotizacion?.costoManoObra ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotizacion((p) => ({ ...(p ?? {}), costoManoObra: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Transporte ({simbolo})</label>
                  <Input type="number" min={0} value={cotizacion?.costoTransporte ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotizacion((p) => ({ ...(p ?? {}), costoTransporte: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Configuración ({simbolo})</label>
                  <Input type="number" min={0} value={cotizacion?.costoConfiguracion ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotizacion((p) => ({ ...(p ?? {}), costoConfiguracion: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Certificación ({simbolo})</label>
                  <Input type="number" min={0} value={cotizacion?.costoCertificacion ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotizacion((p) => ({ ...(p ?? {}), costoCertificacion: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">ITBIS (%)</label>
                  <Input type="number" min={0} value={cotizacion?.itbis ?? 18} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCotizacion((p) => ({ ...(p ?? {}), itbis: parseFloat(e.target.value) || 18 }))} />
                </div>
              </div>

              {totalesCot && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
                  {moneda === 'USD' && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Conversión a US$ usando tasa RD$ {tasa.toLocaleString('es-DO', { minimumFractionDigits: 2 })} por US$1
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal materiales:</span>
                    <span className="font-mono">{fmtMonto(totalesCot.subtotalMateriales)}</span>
                  </div>
                  {(totalesCot?.margen ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Margen ({cotizacion?.margenGanancia}%):</span>
                      <span className="font-mono">{fmtMonto(totalesCot.margen)}</span>
                    </div>
                  )}
                  {(totalesCot?.costosAdicionales ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Costos adicionales:</span>
                      <span className="font-mono">{fmtMonto(totalesCot.costosAdicionales)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span>Subtotal general:</span>
                    <span className="font-mono">{fmtMonto(totalesCot.subtotalGeneral)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ITBIS ({cotizacion?.itbis}%):</span>
                    <span className="font-mono">{fmtMonto(totalesCot.itbisValor)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total General:</span>
                    <span className="font-mono text-primary">{fmtMonto(totalesCot.total)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
