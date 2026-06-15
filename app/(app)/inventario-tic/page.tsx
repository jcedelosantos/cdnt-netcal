'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Inventario {
  id: string;
  nombre: string;
  cliente: {
    nombre: string;
    id: string;
  };
  gastoAnual: number;
  categorias: number;
  estado: string;
  updatedAt: string;
}

export default function InventarioTICPage() {
  const router = useRouter();
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventarios = async () => {
      try {
        const res = await fetch('/api/inventario-tic');
        if (res.ok) {
          const data = await res.json();
          setInventarios(data);
        }
      } catch (e) {
        console.error('Error fetching inventarios:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInventarios();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Inventario TIC</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión profesional de activos tecnológicos</p>
        </div>
        <Button
          onClick={() => router.push('/inventario-tic/crear')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Nuevo
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : inventarios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No hay inventarios creados aún</p>
            <Button
              onClick={() => router.push('/inventario-tic/crear')}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Primer Inventario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventarios.map((inv) => (
            <Card
              key={inv.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/inventario-tic/${inv.id}`)}
            >
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{inv.cliente.nombre}</p>
                  <h3 className="font-semibold text-sm truncate">{inv.nombre}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Categorías</p>
                    <p className="text-lg font-bold">{inv.categorias}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gasto Anual</p>
                    <p className="text-lg font-bold text-green-600">
                      ${inv.gastoAnual.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    inv.estado === 'completado'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.estado === 'completado' ? 'Completado' : 'Borrador'}
                  </span>
                  <p className="text-xs text-gray-400">
                    {new Date(inv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
