'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Inventario {
  id: string;
  nombre: string;
  cliente: { nombre: string; id: string };
  gastoAnual: number;
  categorias: number;
  estado: string;
  updatedAt: string;
}

interface ImportResult {
  ok: boolean;
  inventarios_creados: number;
  total_filas: number;
  advertencias: string[];
  detalle: { nombre: string; cliente: string; categorias: number; articulos: number }[];
}

export default function InventarioTICPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);

  const [showImport, setShowImport] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchInventarios = async () => {
    try {
      const res = await fetch('/api/inventario-tic');
      if (res.ok) setInventarios(await res.json());
    } catch (e) {
      console.error('Error fetching inventarios:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventarios(); }, []);

  const openImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportError(null);
    setShowImport(true);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError('Solo se aceptan archivos Excel (.xlsx / .xls)');
      return;
    }
    setSelectedFile(file);
    setImportError(null);
    setImportResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await fetch('/api/inventario-tic/importar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? 'Error desconocido');
      } else {
        setImportResult(data);
        // Recargar lista
        await fetchInventarios();
      }
    } catch {
      setImportError('Error de red al subir el archivo');
    } finally {
      setImporting(false);
    }
  };

  const closeImport = () => {
    if (importing) return;
    setShowImport(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Inventario TIC</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión profesional de activos tecnológicos</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => router.push('/inventario-tic/crear')} className="gap-2">
          <Plus className="w-4 h-4" />
          Crear Nuevo
        </Button>
        <Button variant="outline" onClick={openImport} className="gap-2">
          <Upload className="w-4 h-4" />
          Importar Excel
        </Button>
        <a
          href="/api/inventario-tic/plantilla"
          download="plantilla_inventario_tic.xlsx"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar Plantilla
        </a>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : inventarios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No hay inventarios creados aún</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={() => router.push('/inventario-tic/crear')} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Crear Primer Inventario
              </Button>
              <Button onClick={openImport} variant="outline" className="gap-2">
                <Upload className="w-4 h-4" /> Importar Excel
              </Button>
            </div>
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
                    <p className="text-lg font-bold text-green-600">${inv.gastoAnual.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    inv.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.estado === 'completado' ? 'Completado' : 'Borrador'}
                  </span>
                  <p className="text-xs text-gray-400">{new Date(inv.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal importar */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Importar Inventarios</h2>
                  <p className="text-xs text-gray-500">Carga masiva desde Excel (.xlsx)</p>
                </div>
              </div>
              <button onClick={closeImport} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Zona drop */}
              {!importResult && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-blue-500 bg-blue-50' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                  />
                  {selectedFile ? (
                    <>
                      <FileSpreadsheet className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB — clic para cambiar</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Arrastra el archivo aquí o <span className="text-blue-600 font-medium">haz clic para seleccionar</span></p>
                      <p className="text-xs text-gray-400 mt-1">Solo archivos .xlsx / .xls</p>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {importError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{importError}</p>
                </div>
              )}

              {/* Resultado exitoso */}
              {importResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {importResult.inventarios_creados} inventario{importResult.inventarios_creados !== 1 ? 's' : ''} creado{importResult.inventarios_creados !== 1 ? 's' : ''} correctamente
                      </p>
                      <p className="text-xs text-green-600">{importResult.total_filas} artículos procesados</p>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {importResult.detalle.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded px-3 py-2">
                        <div>
                          <span className="font-medium">{d.nombre}</span>
                          <span className="text-gray-400"> · {d.cliente}</span>
                        </div>
                        <span className="text-gray-500">{d.categorias} cat · {d.articulos} art</span>
                      </div>
                    ))}
                  </div>

                  {importResult.advertencias.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs font-medium text-yellow-800 mb-1">Advertencias:</p>
                      {importResult.advertencias.map((w, i) => (
                        <p key={i} className="text-xs text-yellow-700">• {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-xl">
              {importResult ? (
                <Button onClick={closeImport}>Cerrar</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={closeImport} disabled={importing}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={!selectedFile || importing} className="gap-2">
                    {importing ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Procesando...</>
                    ) : (
                      <><Upload className="w-4 h-4" />Importar</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
