'use client';
import { Building2, ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CRUDPanel from '@/components/crud-panel';

export default function InventarioClientesPage() {
  const router = useRouter();

  const emptyForm = {
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: '',
    activo: true,
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'contacto', label: 'Contacto', render: (v: any) => v ?? '-' },
    { key: 'telefono', label: 'Teléfono', render: (v: any) => v ?? '-' },
    { key: 'email', label: 'Email', render: (v: any) => v ?? '-' },
    { key: 'direccion', label: 'Dirección', render: (v: any) => v ?? '-' },
    {
      key: 'equipmentCount',
      label: 'Equipos',
      render: (v: any) => (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          {v ?? 0}
        </span>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (v: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {v ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (_v: any, item: any) => (
        <Link
          href={`/inventario/clientes/${item.id}`}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <ExternalLink className="w-3 h-3" />
          Ver inventario
        </Link>
      ),
    },
  ];

  const formFields = [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'contacto', label: 'Contacto' },
    { name: 'telefono', label: 'Teléfono' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'direccion', label: 'Dirección' },
    { name: 'activo', label: 'Activo', type: 'checkbox' },
    { name: 'notas', label: 'Notas', type: 'textarea' },
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
        title="Clientes"
        description="Gestión de clientes para equipos e inventario"
        icon={Building2}
        endpoint="/api/inventario/clientes"
        emptyForm={emptyForm}
        columns={columns}
        formFields={formFields}
        onBeforeSubmit={(form) => ({
          ...form,
          activo: form?.activo ?? true,
        })}
        actions={[]}
      />
    </div>
  );
}
