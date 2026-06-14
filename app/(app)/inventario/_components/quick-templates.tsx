'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TemplatePreload from './template-preload';
import { Zap } from 'lucide-react';

interface Client {
  id: string;
  nombre: string;
}

interface QuickTemplatesProps {
  onSuccess?: () => void;
}

export default function QuickTemplates({ onSuccess }: QuickTemplatesProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/inventario/clientes');
        if (res.ok) {
          const data = await res.json();
          setClients(data || []);
          if (data?.length > 0) {
            setSelectedClientId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching clients:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Precarga Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando clientes...</p>
        ) : clients.length === 0 ? (
          <p className="text-sm text-gray-500">
            Crea un cliente primero para usar precarga rápida
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecciona un cliente:</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              {selectedClientId && (
                <TemplatePreload
                  clientId={selectedClientId}
                  onSuccess={onSuccess}
                />
              )}
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Carga plantillas predefinidas para soportes, proyectos, licencias y consumos.
              Todos los datos son editables después de cargarlos.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
