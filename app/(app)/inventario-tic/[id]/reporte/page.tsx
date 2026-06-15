'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  gastoTotal: number;
  articulos: Articulo[];
}

interface Inventario {
  id: string;
  nombre: string;
  gastoAnual: number;
  estado: string;
  client: { nombre: string };
  categorias: Categoria[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportePage() {
  const router = useRouter();
  const params = useParams();
  const inventarioId = params.id as string;

  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inventarioId) return;
    fetchInventario();
  }, [inventarioId]);

  const fetchInventario = async () => {
    try {
      const res = await fetch(`/api/inventario-tic/${inventarioId}`);
      if (res.ok) {
        const data = await res.json();
        setInventario(data);
      }
    } catch (e) {
      console.error('Error:', e);
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const getPieData = () => {
    if (!inventario) return [];
    return inventario.categorias
      .filter((c) => c.gastoTotal > 0)
      .map((c) => ({
        name: c.nombre,
        value: c.gastoTotal,
      }));
  };

  const getExpiredLicenses = () => {
    if (!inventario) return [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return inventario.categorias
      .flatMap((cat) =>
        cat.articulos.filter((art) => {
          if (!art.fechaVencimiento) return false;
          const vencimiento = new Date(art.fechaVencimiento);
          return vencimiento <= now;
        })
      );
  };

  const getExpiringSoon = () => {
    if (!inventario) return [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return inventario.categorias
      .flatMap((cat) =>
        cat.articulos.filter((art) => {
          if (!art.fechaVencimiento) return false;
          const vencimiento = new Date(art.fechaVencimiento);
          return vencimiento > now && vencimiento <= thirtyDaysFromNow;
        })
      );
  };

  const exportPDF = () => {
    if (!inventario) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFontSize(20);
      doc.text(inventario.nombre, 20, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Cliente: ${inventario.client.nombre}`, 20, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 38);

      // Summary boxes
      doc.setFontSize(10);
      doc.setTextColor(0);
      let yPos = 50;

      const summaryData = [
        { label: 'Total Categorías', value: inventario.categorias.length.toString() },
        { label: 'Total Artículos', value: inventario.categorias.reduce((sum, c) => sum + c.articulos.length, 0).toString() },
        { label: 'Gasto Anual', value: `$${inventario.gastoAnual.toLocaleString()}` },
      ];

      summaryData.forEach((item, idx) => {
        doc.rect(20 + idx * 60, yPos, 50, 20);
        doc.text(item.label, 25 + idx * 60, yPos + 8);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(item.value, 25 + idx * 60, yPos + 16);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
      });

      yPos = 80;

      // Category breakdown table
      const tableData = inventario.categorias.map((c) => [
        c.nombre,
        c.articulos.length.toString(),
        `$${c.gastoTotal.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Categoría', 'Artículos', 'Gasto Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Detailed articles table
      const detailedData: any[] = [];
      inventario.categorias.forEach((cat) => {
        cat.articulos.forEach((art) => {
          detailedData.push([
            cat.nombre,
            art.nombre,
            art.cantidad.toString(),
            `$${art.precioUnitario.toFixed(2)}`,
            `$${art.subtotal.toFixed(2)}`,
          ]);
        });
      });

      if (detailedData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Categoría', 'Artículo', 'Cant.', 'Precio Unit.', 'Subtotal']],
          body: detailedData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
          },
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Generado por RedCalc Inventario TIC', 20, pageHeight - 10);

      doc.save(`${inventario.nombre}.pdf`);
      toast.success('PDF descargado');
    } catch (e) {
      console.error('Error generating PDF:', e);
      toast.error('Error al generar PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando reporte...</p>
      </div>
    );
  }

  if (!inventario) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inventario no encontrado</p>
      </div>
    );
  }

  const pieData = getPieData();
  const expiredLicenses = getExpiredLicenses();
  const expiringSoon = getExpiringSoon();

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl font-bold">{inventario.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">{inventario.client.nombre}</p>
        </div>
        <Button onClick={exportPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-600 font-medium">Categorías</p>
            <p className="text-3xl font-bold text-blue-900">{inventario.categorias.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 font-medium">Artículos</p>
            <p className="text-3xl font-bold text-green-900">
              {inventario.categorias.reduce((sum, c) => sum + c.articulos.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <p className="text-sm text-purple-600 font-medium">Gasto Anual</p>
            <p className="text-3xl font-bold text-purple-900">${inventario.gastoAnual.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {(expiredLicenses.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-3">
          {expiredLicenses.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5" />
                  Licencias Vencidas ({expiredLicenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-red-800">
                  {expiredLicenses.slice(0, 5).map((art) => (
                    <li key={art.id}>• {art.nombre}</li>
                  ))}
                  {expiredLicenses.length > 5 && <li>+ {expiredLicenses.length - 5} más</li>}
                </ul>
              </CardContent>
            </Card>
          )}

          {expiringSoon.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-900">
                  <AlertTriangle className="w-5 h-5" />
                  Licencias por Vencer ({expiringSoon.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {expiringSoon.slice(0, 5).map((art) => (
                    <li key={art.id}>• {art.nombre} - Vence: {new Date(art.fechaVencimiento!).toLocaleDateString()}</li>
                  ))}
                  {expiringSoon.length > 5 && <li>+ {expiringSoon.length - 5} más</li>}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Categoría</th>
                  <th className="text-center px-4 py-2 font-semibold">Artículos</th>
                  <th className="text-right px-4 py-2 font-semibold">Gasto Total</th>
                  <th className="text-right px-4 py-2 font-semibold">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {inventario.categorias.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{cat.nombre}</td>
                    <td className="text-center px-4 py-2">{cat.articulos.length}</td>
                    <td className="text-right px-4 py-2 font-semibold">${cat.gastoTotal.toLocaleString()}</td>
                    <td className="text-right px-4 py-2 text-gray-600">
                      {((cat.gastoTotal / inventario.gastoAnual) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
