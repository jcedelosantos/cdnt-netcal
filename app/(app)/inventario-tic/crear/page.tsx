'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Client {
  id: string;
  nombre: string;
}

type Step = 'cliente' | 'excel' | 'resumen';

export default function CrearInventarioPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('cliente');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/inventario/clientes');
        if (res.ok) {
          const data = await res.json();
          setClients(data || []);
        }
      } catch (e) {
        console.error('Error fetching clients:', e);
      }
    };
    fetchClients();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Solo se aceptan archivos .xlsx o .xls');
        return;
      }
      setFile(selected);
      toast.success('Archivo seleccionado');
    }
  };

  const handleCreateInventario = async () => {
    if (!selectedClientId) {
      toast.error('Selecciona un cliente');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inventario-tic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          nombre: `Inventario 2024 - ${clients.find(c => c.id === selectedClientId)?.nombre}`,
          descripcion: 'Inventario creado desde asistente',
        }),
      });

      if (!res.ok) {
        toast.error('Error al crear inventario');
        return;
      }

      const inventario = await res.json();
      toast.success('Inventario creado');

      // Si hay archivo, ir a paso de Excel
      if (file) {
        setStep('excel');
      } else {
        setStep('resumen');
      }
    } catch (e) {
      toast.error('Error al crear inventario');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!file) {
      toast.error('Selecciona un archivo Excel');
      return;
    }

    setLoading(true);
    try {
      // Por ahora, solo validamos que el archivo sea válido
      // La lógica de procesamiento vendrá en la siguiente fase
      toast.success('Archivo procesado correctamente');
      setStep('resumen');
    } catch (e) {
      toast.error('Error al procesar Excel');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
        <h1 className="text-2xl font-bold">Crear Nuevo Inventario TIC</h1>
        <p className="text-sm text-gray-500 mt-1">Asistente guiado paso a paso</p>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-3">
        {(['cliente', 'excel', 'resumen'] as const).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : ['cliente', 'excel', 'resumen'].indexOf(s) < ['cliente', 'excel', 'resumen'].indexOf(step)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {['cliente', 'excel', 'resumen'].indexOf(s) < ['cliente', 'excel', 'resumen'].indexOf(step) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                idx + 1
              )}
            </div>
            <span className="text-sm font-medium capitalize">{s === 'cliente' ? 'Cliente' : s === 'excel' ? 'Excel' : 'Resumen'}</span>
            {idx < 2 && <div className="flex-1 h-0.5 bg-gray-300 ml-2" />}
          </div>
        ))}
      </div>

      {/* Step: Cliente */}
      {step === 'cliente' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 1: Selecciona el Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente..." />
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

            <div className="pt-4">
              <Button
                onClick={handleCreateInventario}
                disabled={!selectedClientId || loading}
                className="w-full"
              >
                {loading ? 'Creando...' : 'Continuar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Excel */}
      {step === 'excel' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 2: Cargar Excel (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Carga un archivo Excel con tus datos. El archivo puede contener varias hojas:
              <strong> Equipos, Licencias, Consumos, Soportes, Proyectos</strong>
            </p>

            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400"
              onClick={() => document.getElementById('excel-input')?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium">Haz clic para seleccionar archivo</p>
              <p className="text-xs text-gray-500">o arrastra y suelta un .xlsx</p>
              {file && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ {file.name}
                </p>
              )}
            </div>

            <input
              id="excel-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('resumen')}
                className="flex-1"
              >
                Saltar
              </Button>
              <Button
                onClick={handleUploadExcel}
                disabled={!file || loading}
                className="flex-1"
              >
                {loading ? 'Procesando...' : 'Procesar Excel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Resumen */}
      {step === 'resumen' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">✓ Inventario Creado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Tu inventario ha sido creado exitosamente. Puedes comenzar a agregar artículos y categorías.
              </p>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/inventario-tic')}
                className="flex-1"
              >
                Ver Inventarios
              </Button>
              <Button
                onClick={() => router.push('/inventario-tic')}
                className="flex-1"
              >
                Continuar Editando
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
