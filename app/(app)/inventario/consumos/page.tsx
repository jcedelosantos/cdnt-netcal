'use client';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CRUDPanel from '@/components/crud-panel';

export default function InventarioConsumosPage() {
  const router = useRouter();

  const emptyForm = {
    nombre: '',
    categoria: '',
    costoMensual: 0,
    responsable: '',
    proveedor: '',
    notas: '',
    estado: 'activo',
    clientId: '',
  };

  const columns = [
    { key: 'nombre', label: 'Servicio' },
    { key: 'categoria', label: 'Categoría', render: (v: any) => v ?? '-' },
    { key: 'costoMensual', label: 'Costo Mensual', render: (v: any) => v ? `$${v.toFixed(2)}` : '$0.00' },
    { key: 'proveedor', label: 'Proveedor', render: (v: any) => v ?? '-' },
    {
      key: 'estado',
      label: 'Estado',
      render: (v: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          v === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {v === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  const formFields = [
    { name: 'nombre', label: 'Nombre del Servicio', required: true },
    { name: 'categoria', label: 'Categoría' },
    { name: 'costoMensual', label: 'Costo Mensual', type: 'number' },
    { name: 'proveedor', label: 'Proveedor' },
    { name: 'responsable', label: 'Responsable' },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
      ],
    },
    { name: 'notas', label: 'Notas', type: 'textarea' },
    { name: 'clientId', label: 'Cliente', type: 'select', options: [] },
  ];

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <CRUDPanel
        title="Consumos Mensuales"
        description="Gestión de gastos y consumos mensuales recurrentes"
        icon={TrendingUp}
        endpoint="/api/inventario/consumos"
        emptyForm={emptyForm}
        columns={columns}
        formFields={formFields}
        onBeforeSubmit={(form) => ({
          ...form,
          costoMensual: parseFloat(form?.costoMensual) || 0,
          clientId: form?.clientId || undefined,
        })}
        actions={[]}
      />
    </div>
  );
}
