'use client';
import { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; error: string }>;
  total: number;
  message: string;
}

interface ImportEquiposProps {
  onSuccess?: () => void;
}

export default function ImportEquipos({ onSuccess }: ImportEquiposProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Solo se aceptan archivos .xlsx o .xls');
        return;
      }
      setFile(selected);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecciona un archivo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/inventario/equipos/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        toast.success(data.message);
        onSuccess?.();
      } else {
        toast.error(data.error || 'Error al importar');
      }
    } catch (e) {
      toast.error('Error al procesar archivo');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (result?.success) {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Importar Excel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Equipos desde Excel</DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Formato esperado:</strong> Nombre | Tipo | Fabricante | Serial | IP | MAC | Fecha Compra | Garantía | Estado | Responsable | Costo USD | Comentarios
                </p>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400"
                onClick={() => document.getElementById('file-input')?.click()}>
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
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1"
                >
                  {loading ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                      {result.message}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.imported} de {result.total} registros importados
                    </p>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-medium text-sm text-yellow-900 mb-2">Errores ({result.errors.length}):</p>
                  <ul className="space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-xs text-yellow-700">
                        Fila {err.row}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-xs text-yellow-700">
                        +{result.errors.length - 5} errores más
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <Button onClick={handleReset} className="w-full">
                {result.success ? 'Cerrar' : 'Intentar de nuevo'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
