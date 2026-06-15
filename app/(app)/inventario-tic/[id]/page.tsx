'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, FileText, ChevronDown, ChevronRight, Pencil, X, Check, RefreshCw, AlertTriangle, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ImportExcel from './_components/import-excel';

interface Articulo {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  proveedor?: string;
  fechaVencimiento?: string;
}

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  gastoTotal: number;
  articulos: Articulo[];
}

interface Client {
  id: string;
  nombre: string;
}

interface Inventario {
  id: string;
  nombre: string;
  gastoAnual: number;
  estado: string;
  fecha?: string;
  client: { id: string; nombre: string };
}

interface NuevoArticulo {
  nombre: string;
  cantidad: string;
  precioUnitario: string;
  proveedor: string;
  fechaVencimiento: string;
}

const ARTICULO_VACIO: NuevoArticulo = { nombre: '', cantidad: '1', precioUnitario: '0', proveedor: '', fechaVencimiento: '' };

function fechaVencimientoInfo(fecha: string | undefined) {
  if (!fecha) return null;
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
  if (dias < 0) return { label: `Vencida hace ${Math.abs(dias)}d`, color: 'text-red-600', icon: 'critical' };
  if (dias <= 7) return { label: `Vence en ${dias}d`, color: 'text-red-500', icon: 'critical' };
  if (dias <= 30) return { label: `Vence en ${dias}d`, color: 'text-amber-600', icon: 'warning' };
  return { label: new Date(fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }), color: 'text-gray-400', icon: 'ok' };
}

export default function InventarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const inventarioId = params.id as string;

  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [addingArticleTo, setAddingArticleTo] = useState<string | null>(null);
  const [nuevoArticulo, setNuevoArticulo] = useState<NuevoArticulo>(ARTICULO_VACIO);
  const [savingArticulo, setSavingArticulo] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingCell, setEditingCell] = useState<{ artId: string; field: 'cantidad' | 'precioUnitario'; value: string } | null>(null);
  const [editingNombre, setEditingNombre] = useState<{ artId: string; catId: string; value: string } | null>(null);
  const [editingFecha, setEditingFecha] = useState<{ artId: string; catId: string; value: string } | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editEstado, setEditEstado] = useState('');
  const [editClientSearch, setEditClientSearch] = useState('');
  const [editSelectedClient, setEditSelectedClient] = useState<Client | null>(null);
  const [editIsNewClient, setEditIsNewClient] = useState(false);
  const [editClients, setEditClients] = useState<Client[]>([]);
  const [editShowDropdown, setEditShowDropdown] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const editComboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editComboRef.current && !editComboRef.current.contains(e.target as Node)) {
        setEditShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openEdit = () => {
    if (!inventario) return;
    setEditNombre(inventario.nombre);
    setEditFecha(inventario.fecha ? inventario.fecha.split('T')[0] : '');
    setEditEstado(inventario.estado);
    setEditClientSearch(inventario.client.nombre);
    setEditSelectedClient({ id: inventario.client.id, nombre: inventario.client.nombre });
    setEditIsNewClient(false);
    // Load clients for dropdown
    fetch('/api/inventario/clientes')
      .then(r => r.ok ? r.json() : [])
      .then(d => setEditClients(d || []))
      .catch(() => {});
    setShowEdit(true);
  };

  const filteredEditClients = editClients.filter(c =>
    c.nombre.toLowerCase().includes(editClientSearch.toLowerCase())
  );

  const handleSaveEdit = async () => {
    if (!editNombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (!editClientSearch.trim()) { toast.error('El cliente es requerido'); return; }
    setSavingEdit(true);
    try {
      const body: any = {
        nombre: editNombre.trim(),
        fecha: editFecha || null,
        estado: editEstado,
      };
      if (editSelectedClient) {
        body.clientId = editSelectedClient.id;
      } else if (editIsNewClient && editClientSearch.trim()) {
        body.clienteNombre = editClientSearch.trim();
      }
      const res = await fetch(`/api/inventario-tic/${inventarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Inventario actualizado');
        setShowEdit(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    if (!inventarioId) return;
    fetchData();
  }, [inventarioId]);

  const fetchData = async () => {
    try {
      const [invRes, catRes] = await Promise.all([
        fetch(`/api/inventario-tic/${inventarioId}`),
        fetch(`/api/inventario-tic/${inventarioId}/categorias`),
      ]);
      if (invRes.ok) setInventario(await invRes.json());
      if (catRes.ok) setCategorias(await catRes.json());
    } catch (e) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCellSave = async (artId: string, categoriaId: string, field: 'cantidad' | 'precioUnitario', rawValue: string) => {
    const value = parseFloat(rawValue);
    if (isNaN(value) || value < 0) { setEditingCell(null); return; }

    // Optimistic update
    setCategorias(prev => prev.map(cat =>
      cat.id !== categoriaId ? cat : {
        ...cat,
        articulos: cat.articulos.map(a => {
          if (a.id !== artId) return a;
          const updated = { ...a, [field]: value };
          updated.subtotal = updated.cantidad * updated.precioUnitario;
          return updated;
        }),
        gastoTotal: cat.articulos.reduce((s, a) => {
          if (a.id !== artId) return s + a.subtotal;
          const qty = field === 'cantidad' ? value : a.cantidad;
          const price = field === 'precioUnitario' ? value : a.precioUnitario;
          return s + qty * price;
        }, 0),
      }
    ));
    setEditingCell(null);

    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/articulos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId: artId, [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Sync gastoAnual from server
        const invRes = await fetch(`/api/inventario-tic/${inventarioId}`);
        if (invRes.ok) setInventario(await invRes.json());
      } else {
        toast.error('Error al guardar');
        fetchData(); // revert
      }
    } catch {
      toast.error('Error al guardar');
      fetchData();
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/sincronizar`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Sincronizado correctamente');
        fetchData();
      } else {
        toast.error(data.error || 'Error al sincronizar');
      }
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Escribe un nombre para la categoría');
      return;
    }
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCategoryName }),
      });
      if (res.ok) {
        const newCat = await res.json();
        const catConArticulos = { ...newCat, articulos: [] };
        setCategorias(prev => [...prev, catConArticulos]);
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        setExpandedCategory(newCat.id);
        setAddingArticleTo(newCat.id);
        toast.success('Categoría creada');
      }
    } catch (e) {
      toast.error('Error al crear categoría');
    }
  };

  const handleAddArticulo = async (categoriaId: string) => {
    if (!nuevoArticulo.nombre.trim()) {
      toast.error('El nombre del artículo es requerido');
      return;
    }
    setSavingArticulo(true);
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/articulos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoriaId,
          nombre: nuevoArticulo.nombre,
          cantidad: Number(nuevoArticulo.cantidad) || 1,
          precioUnitario: Number(nuevoArticulo.precioUnitario) || 0,
          proveedor: nuevoArticulo.proveedor || null,
          fechaVencimiento: nuevoArticulo.fechaVencimiento || null,
        }),
      });
      if (res.ok) {
        const art = await res.json();
        setCategorias(prev =>
          prev.map(cat =>
            cat.id === categoriaId
              ? { ...cat, articulos: [...(cat.articulos || []), art], gastoTotal: cat.gastoTotal + art.subtotal }
              : cat
          )
        );
        setNuevoArticulo(ARTICULO_VACIO);
        setAddingArticleTo(null);
        toast.success('Artículo agregado');
        fetchData(); // refrescar totales
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al agregar artículo');
      }
    } catch (e) {
      toast.error('Error al agregar artículo');
    } finally {
      setSavingArticulo(false);
    }
  };

  const handleFechaSave = async (artId: string, catId: string, value: string) => {
    setEditingFecha(null);
    const isoDate = value || null;
    setCategorias(prev => prev.map(cat =>
      cat.id !== catId ? cat : {
        ...cat,
        articulos: cat.articulos.map(a => a.id !== artId ? a : { ...a, fechaVencimiento: isoDate ?? undefined }),
      }
    ));
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/articulos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId: artId, fechaVencimiento: isoDate }),
      });
      if (!res.ok) { toast.error('Error al guardar fecha'); fetchData(); }
    } catch { toast.error('Error al guardar fecha'); fetchData(); }
  };

  const handleNombreSave = async (artId: string, catId: string, value: string) => {
    const trimmed = value.trim();
    setEditingNombre(null);
    if (!trimmed) return;
    setCategorias(prev => prev.map(cat =>
      cat.id !== catId ? cat : {
        ...cat,
        articulos: cat.articulos.map(a => a.id !== artId ? a : { ...a, nombre: trimmed }),
      }
    ));
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/articulos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId: artId, nombre: trimmed }),
      });
      if (!res.ok) { toast.error('Error al guardar nombre'); fetchData(); }
    } catch { toast.error('Error al guardar nombre'); fetchData(); }
  };

  const handleDeleteCategory = async (categoriaId: string) => {
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/categorias`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoriaId }),
      });
      if (res.ok) {
        setCategorias(prev => prev.filter(c => c.id !== categoriaId));
        toast.success('Categoría eliminada');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al eliminar');
      }
    } catch { toast.error('Error al eliminar categoría'); }
  };

  const handleDeleteArticle = async (articuloId: string, categoriaId: string) => {
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/articulos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId }),
      });
      if (res.ok) {
        setCategorias(prev =>
          prev.map(cat =>
            cat.id === categoriaId
              ? { ...cat, articulos: (cat.articulos || []).filter(a => a.id !== articuloId) }
              : cat
          )
        );
        toast.success('Artículo eliminado');
        fetchData();
      }
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!inventario) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inventario no encontrado</p>
        <Button onClick={() => router.push('/inventario-tic')} className="mt-4">Volver</Button>
      </div>
    );
  }

  const totalArticulos = categorias.reduce((sum, c) => sum + (c.articulos?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{inventario.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {inventario.client.nombre}
            {inventario.fecha && (
              <span className="ml-2 text-gray-400">
                · {new Date(inventario.fecha).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
            title="Importar licencias, soportes, consumos y proyectos del inventario general del cliente"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando…' : 'Sincronizar inventario'}
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Editar inventario</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cliente combobox */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cliente *</label>
              <div className="relative" ref={editComboRef}>
                <input
                  type="text"
                  value={editClientSearch}
                  onChange={e => {
                    setEditClientSearch(e.target.value);
                    setEditSelectedClient(null);
                    setEditIsNewClient(false);
                    setEditShowDropdown(true);
                  }}
                  onFocus={() => setEditShowDropdown(true)}
                  className="w-full px-3 py-2 border rounded-md text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Busca o escribe el nombre del cliente..."
                />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                {editShowDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredEditClients.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          setEditSelectedClient(c);
                          setEditClientSearch(c.nombre);
                          setEditIsNewClient(false);
                          setEditShowDropdown(false);
                        }}
                      >
                        {editSelectedClient?.id === c.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        {c.nombre}
                      </button>
                    ))}
                    {editClientSearch.trim() && !editClients.find(c => c.nombre.toLowerCase() === editClientSearch.toLowerCase()) && (
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                        onClick={() => {
                          setEditSelectedClient(null);
                          setEditIsNewClient(true);
                          setEditShowDropdown(false);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Crear: <strong className="ml-1">"{editClientSearch.trim()}"</strong>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre del inventario *</label>
              <input
                type="text"
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={editFecha}
                onChange={e => setEditFecha(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={editEstado}
                onChange={e => setEditEstado(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="borrador">Borrador</option>
                <option value="completado">Completado</option>
                <option value="archivado">Archivado</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1">
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600">Categorías</p>
              <p className="text-2xl font-bold">{categorias.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Artículos</p>
              <p className="text-2xl font-bold">{totalArticulos}</p>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs text-gray-600">Gasto Anual</p>
                <p className="text-2xl font-bold text-green-600">
                  ${inventario.gastoAnual.toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/inventario-tic/${inventarioId}/reporte`)}
                className="gap-2 w-fit mt-2"
              >
                <FileText className="w-4 h-4" />
                Ver Reporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nueva Categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!showNewCategoryInput ? (
              <Button
                onClick={() => setShowNewCategoryInput(true)}
                variant="outline"
                size="sm"
                className="w-full gap-1"
              >
                <Plus className="w-3 h-3" />
                Crear Categoría
              </Button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="ej: Licencias, Equipos..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                  className="w-full px-2 py-1.5 border rounded-md text-xs"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateCategory} size="sm" className="flex-1 gap-1">
                    <Plus className="w-3 h-3" />
                    Crear
                  </Button>
                  <Button
                    onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Importar desde Excel</CardTitle>
          </CardHeader>
          <CardContent>
            <ImportExcel inventarioId={inventarioId} onSuccess={fetchData} />
          </CardContent>
        </Card>
      </div>

      {/* Categorías y Artículos */}
      <div className="space-y-3">
        {categorias.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No hay categorías. Crea una para comenzar.</p>
            </CardContent>
          </Card>
        ) : (
          categorias.map((categoria) => {
            const articulos = categoria.articulos || [];
            const isExpanded = expandedCategory === categoria.id;
            const isAddingHere = addingArticleTo === categoria.id;

            return (
              <Card key={categoria.id}>
                <div className="flex items-center">
                  <button
                    className="flex-1 text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedCategory(isExpanded ? null : categoria.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-base">{categoria.nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{articulos.length} artículos</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-700 mr-2">
                        ${(categoria.gastoTotal || 0).toLocaleString()}
                      </p>
                    </div>
                  </button>
                  {articulos.length === 0 && (
                    <button
                      className="px-3 py-4 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar categoría vacía"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(categoria.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <CardContent className="border-t pt-4 space-y-3">
                    {/* Lista de artículos */}
                    {articulos.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-2">Sin artículos aún</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[1fr_70px_90px_80px_32px] gap-2 text-xs text-gray-400 font-medium px-2">
                          <span>Nombre</span>
                          <span className="text-center">Cant. ✎</span>
                          <span className="text-right">Precio ✎</span>
                          <span className="text-right">Subtotal</span>
                          <span />
                        </div>
                        {articulos.map((art) => {
                          const editingQty   = editingCell?.artId === art.id && editingCell.field === 'cantidad';
                          const editingPrice = editingCell?.artId === art.id && editingCell.field === 'precioUnitario';
                          return (
                          <div
                            key={art.id}
                            className="grid grid-cols-[1fr_70px_90px_80px_32px] gap-2 items-center bg-gray-50 hover:bg-gray-100 rounded px-2 py-1.5 text-sm"
                          >
                            <div>
                              {editingNombre?.artId === art.id ? (
                                <input
                                  type="text"
                                  autoFocus
                                  className="w-full border rounded px-1 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  value={editingNombre.value}
                                  onChange={e => setEditingNombre(n => n && { ...n, value: e.target.value })}
                                  onBlur={e => handleNombreSave(art.id, categoria.id, e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                    if (e.key === 'Escape') setEditingNombre(null);
                                  }}
                                />
                              ) : (
                                <p
                                  className="font-medium truncate cursor-pointer hover:text-blue-600 hover:underline"
                                  title="Clic para editar nombre"
                                  onClick={() => setEditingNombre({ artId: art.id, catId: categoria.id, value: art.nombre })}
                                >{art.nombre}</p>
                              )}
                              {art.proveedor && (
                                <p className="text-xs text-gray-400">{art.proveedor}</p>
                              )}
                              {/* Fecha de vencimiento */}
                              {editingFecha?.artId === art.id ? (
                                <input
                                  type="date"
                                  autoFocus
                                  className="mt-0.5 border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  value={editingFecha.value}
                                  onChange={e => setEditingFecha(f => f && { ...f, value: e.target.value })}
                                  onBlur={e => handleFechaSave(art.id, categoria.id, e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                    if (e.key === 'Escape') setEditingFecha(null);
                                  }}
                                />
                              ) : (() => {
                                const info = fechaVencimientoInfo(art.fechaVencimiento);
                                return (
                                  <button
                                    className={`flex items-center gap-1 text-xs mt-0.5 ${info ? info.color : 'text-gray-300 hover:text-blue-500'}`}
                                    title="Clic para editar fecha de vencimiento"
                                    onClick={() => setEditingFecha({ artId: art.id, catId: categoria.id, value: art.fechaVencimiento ? art.fechaVencimiento.split('T')[0] : '' })}
                                  >
                                    {info ? (
                                      <>
                                        {info.icon !== 'ok' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                                        {info.icon === 'ok' && <CalendarClock className="w-3 h-3 shrink-0" />}
                                        {info.label}
                                      </>
                                    ) : (
                                      <><CalendarClock className="w-3 h-3" /> Agregar vencimiento</>
                                    )}
                                  </button>
                                );
                              })()}
                            </div>

                            {/* Cantidad editable */}
                            {editingQty ? (
                              <input
                                type="number" min="0" step="1" autoFocus
                                className="w-full text-center border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                value={editingCell!.value}
                                onChange={e => setEditingCell(c => c && { ...c, value: e.target.value })}
                                onBlur={e => handleCellSave(art.id, categoria.id, 'cantidad', e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            ) : (
                              <p
                                className="text-center text-gray-600 cursor-pointer hover:text-blue-600 hover:underline rounded px-1"
                                title="Clic para editar"
                                onClick={() => setEditingCell({ artId: art.id, field: 'cantidad', value: String(art.cantidad) })}
                              >{art.cantidad}</p>
                            )}

                            {/* Precio editable */}
                            {editingPrice ? (
                              <input
                                type="number" min="0" step="0.01" autoFocus
                                className="w-full text-right border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                value={editingCell!.value}
                                onChange={e => setEditingCell(c => c && { ...c, value: e.target.value })}
                                onBlur={e => handleCellSave(art.id, categoria.id, 'precioUnitario', e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            ) : (
                              <p
                                className="text-right text-gray-600 cursor-pointer hover:text-blue-600 hover:underline rounded px-1"
                                title="Clic para editar"
                                onClick={() => setEditingCell({ artId: art.id, field: 'precioUnitario', value: String(art.precioUnitario) })}
                              >${(art.precioUnitario || 0).toFixed(2)}</p>
                            )}

                            <p className="text-right font-medium">${(art.subtotal || 0).toFixed(2)}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteArticle(art.id, categoria.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Formulario agregar artículo */}
                    {isAddingHere ? (
                      <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
                        <p className="text-xs font-medium text-blue-700">Nuevo artículo</p>
                        <input
                          type="text"
                          placeholder="Nombre del artículo *"
                          value={nuevoArticulo.nombre}
                          onChange={(e) => setNuevoArticulo(prev => ({ ...prev, nombre: e.target.value }))}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                          autoFocus
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Cantidad</label>
                            <input
                              type="number"
                              min="1"
                              value={nuevoArticulo.cantidad}
                              onChange={(e) => setNuevoArticulo(prev => ({ ...prev, cantidad: e.target.value }))}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Precio unitario</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={nuevoArticulo.precioUnitario}
                              onChange={(e) => setNuevoArticulo(prev => ({ ...prev, precioUnitario: e.target.value }))}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Proveedor</label>
                            <input
                              type="text"
                              placeholder="Opcional"
                              value={nuevoArticulo.proveedor}
                              onChange={(e) => setNuevoArticulo(prev => ({ ...prev, proveedor: e.target.value }))}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Fecha de vencimiento</label>
                            <input
                              type="date"
                              value={nuevoArticulo.fechaVencimiento}
                              onChange={(e) => setNuevoArticulo(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            onClick={() => handleAddArticulo(categoria.id)}
                            disabled={savingArticulo}
                            size="sm"
                            className="flex-1"
                          >
                            {savingArticulo ? 'Guardando...' : 'Guardar Artículo'}
                          </Button>
                          <Button
                            onClick={() => { setAddingArticleTo(null); setNuevoArticulo(ARTICULO_VACIO); }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingArticleTo(categoria.id);
                          setNuevoArticulo(ARTICULO_VACIO);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Artículo
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
