'use client';
import { FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CRUDPanel from '@/components/crud-panel';

export default function InventarioLicenciasPage() {
  const router = useRouter();

  const emptyForm = {
    nombre: '',
    categoria: '',
    proveedor: '',
    fechaInicio: '',
    fechaVencimiento: '',
    costoAnual: 0,
    responsable: '',
    estado: 'activa',
    notas: '',
    clientId: '',
  };

  const columns = [
    { key: 'nombre', label: 'Licencia' },
    { key: 'categoria', label: 'Categoría', render: (v: any) => v ?? '-' },
    { key: 'proveedor', label: 'Proveedor', render: (v: any) => v ?? '-' },
    { key: 'fechaVencimiento', label: 'Vencimiento', render: (v: any) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'estado',
      label: 'Estado',
      render: (v: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          v === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {v === 'activa' ? 'Activa' : 'Vencida'}
        </span>
      ),
    },
  ];

  const formFields = [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'categoria', label: 'Categoría' },
    { name: 'proveedor', label: 'Proveedor' },
    { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date' },
    { name: 'fechaVencimiento', label: 'Fecha de Vencimiento', type: 'date' },
    { name: 'costoAnual', label: 'Costo Anual', type: 'number' },
    { name: 'responsable', label: 'Responsable' },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'activa', label: 'Activa' },
        { value: 'vencida', label: 'Vencida' },
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
        title="Licencias"
        description="Gestión de licencias de software y servicios anuales"
        icon={FileText}
        endpoint="/api/inventario/licencias"
        emptyForm={emptyForm}
        columns={columns}
        formFields={formFields}
        onBeforeSubmit={(form) => ({
          ...form,
          costoAnual: parseFloat(form?.costoAnual) || 0,
          fechaInicio: form?.fechaInicio ? new Date(form.fechaInicio).toISOString() : null,
          fechaVencimiento: form?.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
          clientId: form?.clientId || undefined,
        })}
        actions={[]}
      />
    </div>
  );
}
