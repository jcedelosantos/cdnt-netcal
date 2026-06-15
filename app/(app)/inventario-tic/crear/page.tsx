'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Client {
  id: string;
  nombre: string;
}

export default function CrearInventarioPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');

  // Client combobox state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/inventario/clientes')
      .then(r => r.ok ? r.json() : [])
      .then(data => setClients(data || []))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredClients = clients.filter(c =>
    c.nombre.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.nombre);
    setIsNewClient(false);
    setShowDropdown(false);
    // Auto-fill nombre if empty
    if (!nombre.trim()) {
      const year = new Date().getFullYear();
      setNombre(`Inventario ${year} - ${client.nombre}`);
    }
  };

  const handleCreateNew = () => {
    setSelectedClient(null);
    setIsNewClient(true);
    setShowDropdown(false);
    if (!nombre.trim() && clientSearch.trim()) {
      const year = new Date().getFullYear();
      setNombre(`Inventario ${year} - ${clientSearch.trim()}`);
    }
  };

  const handleClientInput = (value: string) => {
    setClientSearch(value);
    setSelectedClient(null);
    setIsNewClient(false);
    setShowDropdown(true);
  };

  const handleSubmit = async () => {
    if (!clientSearch.trim()) {
      toast.error('Selecciona o escribe el nombre del cliente');
      return;
    }
    if (!nombre.trim()) {
      toast.error('Escribe el nombre del inventario');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha,
      };

      if (selectedClient) {
        body.clientId = selectedClient.id;
      } else {
        body.clienteNombre = clientSearch.trim();
      }

      const res = await fetch('/api/inventario-tic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error al crear inventario');
        return;
      }

      const inventario = await res.json();
      toast.success('Inventario creado');
      router.push(`/inventario-tic/${inventario.id}`);
    } catch (e) {
      toast.error('Error al crear inventario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push('/inventario-tic')} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Nuevo Inventario TIC</h1>
        <p className="text-sm text-gray-500 mt-1">Completa los datos para crear el inventario</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del inventario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Cliente combobox */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cliente *</label>
            <div className="relative" ref={comboRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Busca o escribe el nombre del cliente..."
                  value={clientSearch}
                  onChange={e => handleClientInput(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 py-2 border rounded-md text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 && (
                    <>
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => handleSelectClient(c)}
                        >
                          {selectedClient?.id === c.id && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                          <span className={selectedClient?.id === c.id ? 'text-blue-600' : ''}>{c.nombre}</span>
                        </button>
                      ))}
                      {clientSearch.trim() && !clients.find(c => c.nombre.toLowerCase() === clientSearch.toLowerCase()) && (
                        <div className="border-t" />
                      )}
                    </>
                  )}

                  {clientSearch.trim() && !clients.find(c => c.nombre.toLowerCase() === clientSearch.toLowerCase()) && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-600"
                      onClick={handleCreateNew}
                    >
                      <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                      Crear cliente: <strong className="ml-1">"{clientSearch.trim()}"</strong>
                    </button>
                  )}

                  {filteredClients.length === 0 && !clientSearch.trim() && (
                    <p className="px-3 py-2 text-sm text-gray-400">Escribe para buscar...</p>
                  )}
                </div>
              )}
            </div>

            {isNewClient && clientSearch.trim() && (
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <Plus className="w-3 h-3" />
                Se creará un nuevo cliente: <strong>"{clientSearch.trim()}"</strong>
              </p>
            )}
            {selectedClient && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" />
                Cliente existente seleccionado
              </p>
            )}
          </div>

          {/* Nombre del inventario */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre del inventario *</label>
            <input
              type="text"
              placeholder="ej: Inventario 2024 - Reverse"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              placeholder="Notas o descripción del inventario..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !clientSearch.trim() || !nombre.trim()}
            className="w-full"
          >
            {loading ? 'Creando...' : 'Crear Inventario'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
