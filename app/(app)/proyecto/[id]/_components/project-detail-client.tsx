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
  Plus, PackagePlus, Receipt, Hash, Wallet, CreditCard,
  ChevronDown, ChevronRight,
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ categoria: 'Adicionales', nombre: '', cantidad: 1, unidad: 'und', precioUnit: 0 });
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const [facturando, setFacturando] = useState(false);
  const [editandoNcf, setEditandoNcf] = useState(false);
  const [ncfTipo, setNcfTipo] = useState('B01');
  const [ncfNumero, setNcfNumero] = useState('');
  const [savingNcf, setSavingNcf] = useState(false);
  const [newPago, setNewPago] = useState({ concepto: '', monto: 0, fecha: new Date().toISOString().slice(0, 10), metodoPago: 'Transferencia', referencia: '' });
  const [savingPago, setSavingPago] = useState(false);

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
      // Init prices and quantities from stored materials
      const storedPrices: Record<string, number> = {};
      const storedQtys: Record<string, number> = {};
      for (const m of (data?.project?.materiales ?? [])) {
        if (m?.id) {
          storedQtys[m.id] = m.cantidad ?? 0;
          if ((m?.precioUnit ?? 0) > 0) storedPrices[m.id] = m.precioUnit;
        }
      }
      setQuantities(storedQtys);
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
    if (!confirm('¿Eliminar este material?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/materiales/${materialId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Material eliminado');
      setQuantities((prev) => { const n = { ...prev }; delete n[materialId]; return n; });
      setPrices((prev) => { const n = { ...prev }; delete n[materialId]; return n; });
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

  const handleFacturar = async () => {
    if (project?.numeroFactura) {
      if (!confirm('Este proyecto ya tiene factura. ¿Deseas anular la factura?')) return;
      setFacturando(true);
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facturar: false }),
        });
        if (!res.ok) throw new Error();
        toast.success('Factura anulada');
        fetchProject();
      } catch {
        toast.error('Error al anular factura');
      } finally {
        setFacturando(false);
      }
      return;
    }
    setFacturando(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturar: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      toast.success(`Factura ${d?.numeroFactura ?? ''} generada`);
      fetchProject();
    } catch {
      toast.error('Error al facturar');
    } finally {
      setFacturando(false);
    }
  };

  const handleSaveNcf = async () => {
    const digits = ncfNumero.replace(/\D/g, '').padStart(8, '0').slice(0, 8);
    const ncf = `${ncfTipo}-${digits}`;
    setSavingNcf(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroFactura: ncf }),
      });
      if (!res.ok) throw new Error();
      toast.success(`NCF actualizado: ${ncf}`);
      setProject((prev: any) => ({ ...(prev ?? {}), numeroFactura: ncf }));
      setEditandoNcf(false);
    } catch {
      toast.error('Error al actualizar NCF');
    } finally {
      setSavingNcf(false);
    }
  };

  const handleAddPago = async () => {
    if (!newPago.monto || newPago.monto <= 0) { toast.error('El monto debe ser mayor a cero'); return; }
    setSavingPago(true);
    try {
      // El monto se ingresa en la moneda visible; se guarda siempre en RD$
      const montoDOP = moneda === 'USD' ? newPago.monto * (tasaDolar > 0 ? tasaDolar : 1) : newPago.monto;
      const res = await fetch(`/api/projects/${projectId}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPago, monto: montoDOP }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d?.error ?? 'Error al registrar pago'); return; }
      toast.success('Pago registrado');
      setNewPago({ concepto: '', monto: 0, fecha: new Date().toISOString().slice(0, 10), metodoPago: 'Transferencia', referencia: '' });
      fetchProject();
    } catch {
      toast.error('Error al registrar pago');
    } finally {
      setSavingPago(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!confirm('¿Eliminar este pago?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/pagos/${pagoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Pago eliminado');
      fetchProject();
    } catch {
      toast.error('Error al eliminar pago');
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
    const resumen = resultado?.resumen ?? {};
    // Agrupar desde project.materiales (respeta eliminaciones y cambios de cantidad)
    const orden: string[] = [];
    const grupos: Record<string, any[]> = {};
    for (const m of (project?.materiales ?? [])) {
      const cat = m?.categoria ?? (m?.esPersonalizado ? 'Adicionales' : 'Otros');
      if (!grupos[cat]) { grupos[cat] = []; orden.push(cat); }
      const qty = quantities[m.id] ?? m.cantidad ?? 0;
      const price = prices[m.id] ?? m.precioUnit ?? 0;
      grupos[cat].push({
        nombre: m?.nombre ?? '',
        cantidad: qty,
        unidad: m?.unidad ?? 'und',
        precioUnit: price,
        subtotal: qty * price,
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
            banco: empresa?.empresaBanco ?? undefined,
            cuenta: empresa?.empresaCuenta ?? undefined,
            tipoCuenta: empresa?.empresaTipoCuenta ?? undefined,
            nombreCuenta: empresa?.empresaNombreCuenta ?? undefined,
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
        numeroCotizacion: project?.numeroCotizacion ?? undefined,
        numeroFactura: project?.numeroFactura ?? undefined,
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
      pagos: (project?.pagos ?? []).map((p: any) => ({
        fecha: p?.fecha ?? undefined,
        concepto: p?.concepto ?? 'Pago',
        monto: p?.monto ?? 0,
      })),
    };
  };

  const handleSavePrices = async () => {
    setSaving(true);
    try {
      // Construir lista de materiales con id + cantidad y precio actuales
      const materialesPayload = (project?.materiales ?? [])
        .filter((m: any) => m?.id)
        .map((m: any) => ({
          id: m.id,
          cantidad: quantities[m.id] ?? m.cantidad ?? 0,
          precioUnit: prices[m.id] ?? m.precioUnit ?? 0,
        }));
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
    const subtotalMateriales = (project?.materiales ?? []).reduce((acc: number, m: any) => {
      const qty = quantities[m.id] ?? m.cantidad ?? 0;
      const price = prices[m.id] ?? m.precioUnit ?? 0;
      return acc + qty * price;
    }, 0);
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

  // Group by category using stored project.materiales (includes custom + generated)
  const categorias: Record<string, any[]> = {};
  for (const m of (project?.materiales ?? [])) {
    const cat = m?.categoria ?? (m?.esPersonalizado ? 'Adicionales' : 'Otros');
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
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              {project?.numeroCotizacion && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
                  <Hash className="w-3 h-3" /> {project.numeroCotizacion}
                </span>
              )}
              {project?.numeroFactura && !editandoNcf && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono">
                  <Receipt className="w-3 h-3" /> {project.numeroFactura}
                  <button
                    className="ml-1 hover:text-indigo-900"
                    title="Editar NCF"
                    onClick={() => {
                      const val = project.numeroFactura ?? '';
                      // Detect NCF format: B01-00000001
                      const ncfMatch = val.match(/^(B\d{2})-(\d{8})$/);
                      setNcfTipo(ncfMatch ? ncfMatch[1] : 'B01');
                      setNcfNumero(ncfMatch ? ncfMatch[2] : '');
                      setEditandoNcf(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </span>
              )}
              {project?.numeroFactura && editandoNcf && (
                <span className="inline-flex items-center gap-1 flex-wrap">
                  <select
                    value={ncfTipo}
                    onChange={(e) => setNcfTipo(e.target.value)}
                    className="text-xs border rounded px-1 py-0.5 font-mono bg-white"
                  >
                    <option value="B01">B01 – Crédito Fiscal</option>
                    <option value="B02">B02 – Consumidor Final</option>
                    <option value="B14">B14 – Régimen Especial</option>
                    <option value="B15">B15 – Gubernamental</option>
                  </select>
                  <Input
                    className="h-6 w-28 text-xs font-mono px-1"
                    placeholder="00000001"
                    maxLength={8}
                    value={ncfNumero}
                    onChange={(e) => setNcfNumero(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  />
                  <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveNcf} disabled={savingNcf}>
                    {savingNcf ? '...' : 'OK'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-1" onClick={() => setEditandoNcf(false)}>
                    ✕
                  </Button>
                </span>
              )}
              {showPrices && project?.estadoPago && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                  project.estadoPago === 'pagado' ? 'bg-green-50 text-green-700' :
                  project.estadoPago === 'parcial' ? 'bg-amber-50 text-amber-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Wallet className="w-3 h-3" /> {
                    project.estadoPago === 'pagado' ? 'Pagado' :
                    project.estadoPago === 'parcial' ? 'Pago parcial' : 'Pago pendiente'
                  }
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {project?.cliente ?? ''}{project?.cliente && project?.ubicacion ? ' • ' : ''}{project?.ubicacion ?? ''}
              {' • '}{project?.categoriaCable ?? 'Cat6'}
            </p>
            {project?.aprobado && project?.aprobadoEn && (
              <p className="text-xs text-green-600 mt-0.5">Aprobado el {fmtFecha(project.aprobadoEn)}</p>
            )}
            {project?.numeroFactura && project?.facturadoEn && (
              <p className="text-xs text-indigo-600 mt-0.5">Facturado el {fmtFecha(project.facturadoEn)}</p>
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
            <Button
              variant={project?.numeroFactura ? 'outline' : 'default'}
              size="sm"
              onClick={handleFacturar}
              disabled={facturando}
              className={project?.numeroFactura ? 'text-indigo-700 border-indigo-300 hover:bg-indigo-50' : 'bg-indigo-600 hover:bg-indigo-700'}
            >
              <Receipt className="w-4 h-4 mr-1" /> {facturando ? '...' : project?.numeroFactura ? 'Facturado' : 'Facturar'}
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
          {(() => {
            const cats = Object.keys(categorias);
            const allCollapsed = cats.length > 0 && cats.every((c) => collapsedCats[c]);
            return (
              <Button variant="ghost" size="sm" onClick={() => {
                const next: Record<string, boolean> = {};
                if (!allCollapsed) cats.forEach((c) => { next[c] = true; });
                setCollapsedCats(next);
              }}>
                {allCollapsed ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                {allCollapsed ? 'Expandir todo' : 'Colapsar todo'}
              </Button>
            );
          })()}
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
        const collapsed = !!collapsedCats[cat];
        const itemsCount = (items ?? []).length;
        return (
          <FadeIn key={cat} delay={0.1 * ci}>
            <Card className="mb-4">
              <CardHeader className="py-3">
                <button
                  type="button"
                  onClick={() => setCollapsedCats((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                  className="w-full flex items-center gap-2 text-left"
                >
                  {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${catColor}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-display font-semibold">{cat}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}</span>
                </button>
              </CardHeader>
              {!collapsed && (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Material</TableHead>
                        <TableHead className="text-center w-28">Cantidad</TableHead>
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
                        const isCustom = !!m?.esPersonalizado;
                        const qty = quantities[m.id] ?? m?.cantidad ?? 0;
                        const price = prices[m.id] ?? m?.precioUnit ?? 0;
                        const subtotal = qty * price;
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
                            <TableCell className="text-center w-24">
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                className="w-20 h-8 text-center mx-auto"
                                value={qty || ''}
                                placeholder="0"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setQuantities((prev) => ({ ...prev, [m.id]: val }));
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">{m?.unidad ?? 'und'}</TableCell>
                            {showPrices && (
                              <>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    className="w-28 h-8 text-right mx-auto"
                                    value={price || ''}
                                    placeholder="0.00"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setPrices((prev) => ({ ...prev, [m.id]: val }));
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-mono pr-6">
                                  {subtotal > 0 ? `${simbolo} ${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-'}
                                </TableCell>
                              </>
                            )}
                            <TableCell className="text-center w-10 pr-4">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteMaterial(m.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              )}
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

                  {/* Pagos aplicados y balance pendiente */}
                  {(project?.pagos ?? []).length > 0 && (() => {
                    const totalPagado = (project?.pagos ?? []).reduce((acc: number, p: any) => acc + (p?.monto ?? 0), 0);
                    const balance = totalesCot.total - totalPagado;
                    return (
                      <>
                        <div className="border-t pt-2 mt-1 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Pagos recibidos</p>
                          {(project?.pagos ?? []).map((p: any) => (
                            <div key={p.id} className="flex justify-between text-sm text-green-700">
                              <span>{fmtFecha(p?.fecha)} — {p?.concepto ?? 'Pago'}</span>
                              <span className="font-mono">− {fmtMonto(p?.monto ?? 0)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-medium pt-1">
                            <span>Total pagado:</span>
                            <span className="font-mono text-green-700">− {fmtMonto(totalPagado)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Balance pendiente:</span>
                          <span className={`font-mono ${balance <= 0 ? 'text-green-600' : 'text-amber-600'}`}>{fmtMonto(balance)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Pagos anticipados */}
      {showPrices && totalesCot && (
        <FadeIn>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Pagos y Anticipos
              </CardTitle>
              <CardDescription>Registra los abonos del cliente por fecha y monto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumen financiero */}
              {(() => {
                const totalCot = totalesCot.total;
                const totalPagado = (project?.pagos ?? []).reduce((acc: number, p: any) => acc + (p?.monto ?? 0), 0);
                const balance = totalCot - totalPagado;
                const pct = totalCot > 0 ? Math.min(100, Math.round((totalPagado / totalCot) * 100)) : 0;
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-lg font-mono font-bold">{fmtMonto(totalCot)}</p>
                        <p className="text-xs text-muted-foreground">Total cotizado</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <p className="text-lg font-mono font-bold text-green-700">{fmtMonto(totalPagado)}</p>
                        <p className="text-xs text-muted-foreground">Pagado</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="text-lg font-mono font-bold text-amber-700">{fmtMonto(balance)}</p>
                        <p className="text-xs text-muted-foreground">Balance pendiente</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-lg font-mono font-bold text-blue-700">{pct}%</p>
                        <p className="text-xs text-muted-foreground">Completado</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </>
                );
              })()}

              {/* Lista de pagos */}
              {(project?.pagos ?? []).length > 0 && (
                <div className="border rounded-lg divide-y">
                  {(project?.pagos ?? []).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p?.concepto ?? 'Pago'}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtFecha(p?.fecha)}
                          {p?.metodoPago ? ` • ${p.metodoPago}` : ''}
                          {p?.referencia ? ` • Ref: ${p.referencia}` : ''}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-medium text-green-700">{fmtMonto(p?.monto ?? 0)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePago(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario nuevo pago */}
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Concepto</label>
                    <Input placeholder="Ej: 50% anticipo" value={newPago.concepto}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPago((p) => ({ ...p, concepto: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Monto ({simbolo})</label>
                    <Input type="number" min={0} step={0.01} placeholder="0.00" value={newPago.monto || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPago((p) => ({ ...p, monto: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Fecha</label>
                    <Input type="date" value={newPago.fecha}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPago((p) => ({ ...p, fecha: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Método</label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={newPago.metodoPago}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPago((p) => ({ ...p, metodoPago: e.target.value }))}>
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                      <option>Cheque</option>
                      <option>Tarjeta</option>
                      <option>Depósito</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Referencia</label>
                    <Input placeholder="Opcional" value={newPago.referencia}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPago((p) => ({ ...p, referencia: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-3">
                  <Button size="sm" onClick={handleAddPago} disabled={savingPago}>
                    <Plus className="w-4 h-4 mr-1" /> {savingPago ? 'Guardando...' : 'Agregar pago'}
                  </Button>
                </div>
              </div>

              {moneda === 'USD' && (
                <p className="text-xs text-muted-foreground">
                  Nota: los montos se guardan en RD$. El monto que ingreses se interpreta en {simbolo} y se convierte a RD$ usando la tasa {tasa.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.
                </p>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
