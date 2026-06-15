'use client';
import { Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CRUDPanel from '@/components/crud-panel';

export default function InventarioSoportesPage() {
  const router = useRouter();

  const emptyForm = {
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    servicios: '',
    costoMensual: 0,
    costoAnual: 0,
    contrato: '',
    estado: 'activo',
    clientId: '',
  };

  const columns = [
    { key: 'nombre', label: 'Proveedor' },
    { key: 'contacto', label: 'Contacto', render: (v: any) => v ?? '-' },
    { key: 'servicios', label: 'Servicios', render: (v: any) => v ? v.substring(0, 40) + '...' : '-' },
    { key: 'costoMensual', label: 'Costo Mensual', render: (v: any) => v ? `$${v.toFixed(2)}` : '$0.00' },
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
    { name: 'nombre', label: 'Nombre del Proveedor', required: true },
    { name: 'contacto', label: 'Contacto' },
    { name: 'telefono', label: 'Teléfono' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'servicios', label: 'Servicios Ofrecidos', type: 'textarea' },
    { name: 'costoMensual', label: 'Costo Mensual', type: 'number' },
    { name: 'costoAnual', label: 'Costo Anual', type: 'number' },
    { name: 'contrato', label: 'Número de Contrato' },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
      ],
    },
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
        title="Soportes Tercerizados"
        description="Gestión de proveedores y servicios de soporte externos"
        icon={Users}
        endpoint="/api/inventario/soportes"
        emptyForm={emptyForm}
        columns={columns}
        formFields={formFields}
        onBeforeSubmit={(form) => ({
          ...form,
          costoMensual: parseFloat(form?.costoMensual) || 0,
          costoAnual: parseFloat(form?.costoAnual) || 0,
          clientId: form?.clientId || undefined,
        })}
        actions={[]}
      />
    </div>
  );
}
