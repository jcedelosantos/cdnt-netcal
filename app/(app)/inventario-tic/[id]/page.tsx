'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

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

interface Inventario {
  id: string;
  nombre: string;
  gastoAnual: number;
  estado: string;
  client: { nombre: string };
}

export default function InventarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const inventarioId = params.id as string;

  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!inventarioId) return;
    fetchData();
  }, [inventarioId]);

  const fetchData = async () => {
    try {
      // Fetch inventario
      const invRes = await fetch(`/api/inventario-tic/${inventarioId}`);
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventario(invData);
      }

      // Fetch categorías
      const catRes = await fetch(`/api/inventario-tic/${inventarioId}/categorias`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategorias(catData);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) {
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
        const newCategory = await res.json();
        setCategorias([...categorias, newCategory]);
        setNewCategoryName('');
        toast.success('Categoría creada');
      }
    } catch (e) {
      toast.error('Error al crear categoría');
    }
  };

  const handleDeleteArticle = async (articuloId: string, categoriaId: string) => {
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}/articulos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId }),
      });

      if (res.ok) {
        setCategorias(
          categorias.map((cat) =>
            cat.id === categoriaId
              ? {
                  ...cat,
                  articulos: cat.articulos.filter((a) => a.id !== articuloId),
                }
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!inventario) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inventario no encontrado</p>
        <Button onClick={() => router.push('/inventario-tic')} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{inventario.nombre}</h1>
        <p className="text-sm text-gray-500 mt-1">{inventario.client.nombre}</p>
      </div>

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
              <p className="text-2xl font-bold">
                {categorias.reduce((sum, c) => sum + c.articulos.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Gasto Anual</p>
              <p className="text-2xl font-bold text-green-600">
                ${inventario.gastoAnual.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nueva Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar Categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ej: Equipos, Licencias, Consumos..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button onClick={handleCreateCategory} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categorías y Artículos */}
      <div className="space-y-4">
        {categorias.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No hay categorías. Crea una para comenzar.</p>
            </CardContent>
          </Card>
        ) : (
          categorias.map((categoria) => (
            <Card key={categoria.id}>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === categoria.id ? null : categoria.id
                  )
                }
              >
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base">{categoria.nombre}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {categoria.articulos.length} artículos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${categoria.gastoTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {expandedCategory === categoria.id && (
                <CardContent className="space-y-3 border-t pt-4">
                  {categoria.articulos.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay artículos</p>
                  ) : (
                    <div className="space-y-2">
                      {categoria.articulos.map((art) => (
                        <div
                          key={art.id}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{art.nombre}</p>
                            <p className="text-xs text-gray-500">
                              {art.cantidad} × ${art.precioUnitario.toFixed(2)} = $
                              {art.subtotal.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteArticle(art.id, categoria.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar Artículo (placeholder para siguiente fase) */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 mt-3"
                    onClick={() =>
                      toast.info('Agregar artículos disponible en próxima versión')
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Artículo
                  </Button>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
