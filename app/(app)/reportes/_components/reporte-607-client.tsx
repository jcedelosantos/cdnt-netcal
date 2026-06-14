'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';
import { FileSpreadsheet, Download, Receipt, Calendar } from 'lucide-react';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const fmtMonto = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(n);

interface Props {
  empresaNombre?: string;
}

export default function Reporte607Client({ empresaNombre }: Props) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [año, setAño] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [previewMes, setPreviewMes] = useState<number | null>(null);
  const [previewAño, setPreviewAño] = useState<number | null>(null);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes/607?mes=${mes}&año=${año}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.filas ?? []);
      setPreviewMes(mes);
      setPreviewAño(año);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!preview || preview.length === 0) {
      toast.error('No hay facturas para exportar');
      return;
    }
    setLoading(true);
    try {
      const { exportarReporte607 } = await import('@/lib/exporters');
      await exportarReporte607(preview, previewMes!, previewAño!, empresaNombre);
      toast.success('Reporte 607 descargado');
    } catch (e: any) {
      toast.error('Error al generar Excel');
    } finally {
      setLoading(false);
    }
  };

  const totalMonto = (preview ?? []).reduce((a: number, f: any) => a + (f.montoFacturado ?? 0), 0);
  const totalItbis = (preview ?? []).reduce((a: number, f: any) => a + (f.itbisFacturado ?? 0), 0);
  const totalGen = (preview ?? []).reduce((a: number, f: any) => a + (f.totalFactura ?? 0), 0);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <FadeIn>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Reporte 607</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            Registro de ventas con NCF para la DGII
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Seleccionar período
            </CardTitle>
            <CardDescription>Seleccione el mes y año del reporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Mes</label>
                <select
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm w-40"
                  value={mes}
                  onChange={(e) => { setMes(Number(e.target.value)); setPreview(null); }}
                >
                  {MESES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Año</label>
                <select
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm w-28"
                  value={año}
                  onChange={(e) => { setAño(Number(e.target.value)); setPreview(null); }}
                >
                  {[2023, 2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <Button onClick={fetchPreview} disabled={loading} variant="outline">
                {loading ? 'Cargando...' : 'Consultar'}
              </Button>
              {preview && preview.length > 0 && (
                <Button onClick={handleExport} disabled={loading} className="gap-2">
                  <Download className="w-4 h-4" />
                  Descargar Excel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {preview !== null && (
        <FadeIn delay={0.15}>
          {preview.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No hay facturas en {MESES[(previewMes ?? 1) - 1]} {previewAño}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Facturas</p>
                    <p className="text-2xl font-mono font-bold">{preview.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Monto s/ITBIS</p>
                    <p className="text-lg font-mono font-bold text-blue-700">{fmtMonto(totalMonto)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Total c/ITBIS</p>
                    <p className="text-lg font-mono font-bold text-green-700">{fmtMonto(totalGen)}</p>
                    <p className="text-xs text-muted-foreground">ITBIS: {fmtMonto(totalItbis)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla preview */}
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium">Cliente</th>
                        <th className="text-left px-3 py-3 font-medium">RNC/Cédula</th>
                        <th className="text-left px-3 py-3 font-medium">NCF</th>
                        <th className="text-center px-3 py-3 font-medium">Fecha</th>
                        <th className="text-right px-3 py-3 font-medium">Monto</th>
                        <th className="text-right px-3 py-3 font-medium">ITBIS</th>
                        <th className="text-right px-4 py-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((f: any, i: number) => {
                        const fc = String(f.fechaComprobante);
                        const fechaStr = `${fc.slice(6,8)}/${fc.slice(4,6)}/${fc.slice(0,4)}`;
                        return (
                          <tr key={i} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-2.5 font-medium">{f.nombreCliente || '—'}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{f.rncCedula || '—'}</td>
                            <td className="px-3 py-2.5 font-mono text-blue-700">{f.ncf}</td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{fechaStr}</td>
                            <td className="px-3 py-2.5 text-right">{fmtMonto(f.montoFacturado)}</td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground">{fmtMonto(f.itbisFacturado)}</td>
                            <td className="px-4 py-2.5 text-right font-medium">{fmtMonto(f.totalFactura)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 font-bold">
                        <td colSpan={4} className="px-4 py-2.5 text-blue-800">TOTAL ({preview.length})</td>
                        <td className="px-3 py-2.5 text-right text-blue-800">{fmtMonto(totalMonto)}</td>
                        <td className="px-3 py-2.5 text-right text-blue-800">{fmtMonto(totalItbis)}</td>
                        <td className="px-4 py-2.5 text-right text-blue-800">{fmtMonto(totalGen)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </FadeIn>
      )}
    </div>
  );
}
