'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/animate';
import { Tags, Plus, Search, Pencil, Trash2, X, Save, CalendarDays, Building2 } from 'lucide-react';

const CATEGORIAS = ['Cable', 'Cámara', 'Switch', 'NVR/DVR', 'Disco', 'UPS', 'Rack/Gabinete', 'Accesorio', 'Mano de obra', 'Otro'];
const FUENTES = ['cotizacion', 'factura'];

type Precio = {
  id: string; nombre: string; categoria: string | null; suplidor: string | null;
  precio: number; unidad: string; fuente: string | null; fecha: string; notas: string | null;
};

const VACIO = { nombre: '', categoria: '', suplidor: '', precio: '', unidad: 'und', fuente: 'cotizacion', fecha: new Date().toISOString().slice(0, 10), notas: '' };

export default function PreciosReferenciaClient() {
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPrecios = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/precios-referencia${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      setPrecios(data.precios ?? []);
    } catch {
      toast.error('Error al cargar precios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrecios(); }, [fetchPrecios]);

  const handleBuscar = (v: string) => {
    setBusqueda(v);
    fetchPrecios(v);
  };

  const openNew = () => { setForm(VACIO); setEditId(null); setShowForm(true); };
  const openEdit = (p: Precio) => {
    setForm({
      nombre: p.nombre, categoria: p.categoria ?? '', suplidor: p.suplidor ?? '',
      precio: String(p.precio), unidad: p.unidad, fuente: p.fuente ?? 'cotizacion',
      fecha: new Date(p.fecha).toISOString().slice(0, 10), notas: p.notas ?? '',
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (!form.precio || isNaN(Number(form.precio))) { toast.error('El precio es requerido'); return; }
    if (!form.fecha) { toast.error('La fecha es requerida'); return; }

    setSaving(true);
    try {
      const url = editId ? `/api/precios-referencia/${editId}` : '/api/precios-referencia';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Error al guardar'); return; }
      toast.success(editId ? 'Precio actualizado' : 'Precio agregado');
      setShowForm(false);
      fetchPrecios(busqueda);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      const res = await fetch(`/api/precios-referencia/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Error al eliminar'); return; }
      toast.success('Eliminado');
      fetchPrecios(busqueda);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const fmtFecha = (d: string) => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtPrecio = (n: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <Tags className="w-6 h-6 text-primary" /> Precios de Referencia
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Precios de suplidores para sugerir al agregar materiales en proyectos.
            </p>
          </div>
          <Button onClick={openNew} className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Nuevo precio
          </Button>
        </div>
      </FadeIn>

      {/* Formulario */}
      {showForm && (
        <FadeIn>
          <Card className="mb-6 border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center justify-between">
                {editId ? 'Editar precio' : 'Nuevo precio'}
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre del producto *</Label>
                  <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Cámara Domo 6MP Hikvision DS-2CD1367G2H" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Suplidor</Label>
                  <Input value={form.suplidor} onChange={e => setForm(f => ({ ...f, suplidor: e.target.value }))} placeholder="Ej: Dytech, ElectronicaPoderosa" />
                </div>
                <div className="space-y-2">
                  <Label>Precio (RD$) *</Label>
                  <Input type="number" min={0} step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Input value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} placeholder="und, mt, pie..." />
                </div>
                <div className="space-y-2">
                  <Label>Fuente</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.fuente} onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))}>
                    {FUENTES.map(f => <option key={f} value={f}>{f === 'cotizacion' ? 'Cotización' : 'Factura'}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notas</Label>
                  <Input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones opcionales" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600">
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar producto..." value={busqueda} onChange={e => handleBuscar(e.target.value)} />
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : precios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Tags className="w-8 h-8 opacity-30" />
              {busqueda ? 'Sin resultados' : 'Aún no hay precios registrados'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Suplidor</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fuente</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {precios.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.nombre}</div>
                        {p.categoria && <div className="text-xs text-muted-foreground">{p.categoria}</div>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {p.suplidor ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="w-3 h-3" /> {p.suplidor}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {fmtPrecio(p.precio)}
                        <span className="text-xs text-muted-foreground ml-1">/{p.unidad}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <CalendarDays className="w-3 h-3" /> {fmtFecha(p.fecha)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.fuente === 'factura' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {p.fuente === 'factura' ? 'Factura' : 'Cotización'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.nombre)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        {precios.length} {precios.length === 1 ? 'precio registrado' : 'precios registrados'}
      </p>
    </div>
  );
}
