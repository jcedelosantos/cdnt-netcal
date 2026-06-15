'use client';
import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImportExcelProps {
  inventarioId: string;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  categoriesCreated: number;
  articlesCreated: number;
  errors: Array<{ sheet: string; row: number; error: string }>;
  message: string;
}

export default function ImportExcel({ inventarioId, onSuccess }: ImportExcelProps) {
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
      toast.success('Archivo seleccionado');
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

      const res = await fetch(`/api/inventario-tic/${inventarioId}/import-excel`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        if (data.success) {
          toast.success(data.message);
          onSuccess?.();
        } else {
          toast.warning(data.message);
        }
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
            <DialogTitle>Importar Datos desde Excel</DialogTitle>
            <DialogDescription>
              Carga un archivo Excel con múltiples hojas (Equipos, Licencias, Consumos, etc.)
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200 p-3">
                <p className="text-xs text-blue-700">
                  <strong>Formato:</strong> Cada hoja representa una categoría. Las columnas deben incluir:
                  <br />
                  <strong>nombre</strong>, cantidad, precio, proveedor (opcional), vencimiento (opcional)
                </p>
              </Card>

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
              <div
                className={`rounded-lg p-4 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${result.success ? 'text-green-900' : 'text-yellow-900'}`}>
                      {result.message}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.categoriesCreated} categorías · {result.articlesCreated} artículos
                    </p>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-sm text-red-900 mb-2">
                    Errores ({result.errors.length}):
                  </p>
                  <ul className="space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-xs text-red-700">
                        Hoja "{err.sheet}" fila {err.row}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-xs text-red-700">
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
