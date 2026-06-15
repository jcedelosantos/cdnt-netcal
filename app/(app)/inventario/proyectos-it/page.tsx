'use client';
import { Rocket, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CRUDPanel from '@/components/crud-panel';

export default function InventarioProyectosPage() {
  const router = useRouter();

  const emptyForm = {
    nombre: '',
    descripcion: '',
    estado: 'en_progreso',
    responsable: '',
    presupuesto: 0,
    avance: 0,
    fechaInicio: '',
    fechaFin: '',
    notas: '',
    clientId: '',
  };

  const columns = [
    { key: 'nombre', label: 'Proyecto' },
    { key: 'descripcion', label: 'Descripción', render: (v: any) => v ? v.substring(0, 50) + '...' : '-' },
    {
      key: 'estado',
      label: 'Estado',
      render: (v: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          v === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
          v === 'completado' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          {v === 'en_progreso' ? 'En Progreso' : v === 'completado' ? 'Completado' : 'Pausado'}
        </span>
      ),
    },
    { key: 'avance', label: 'Avance', render: (v: any) => `${v || 0}%` },
  ];

  const formFields = [
    { name: 'nombre', label: 'Nombre del Proyecto', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'en_progreso', label: 'En Progreso' },
        { value: 'completado', label: 'Completado' },
        { value: 'pausado', label: 'Pausado' },
      ],
    },
    { name: 'responsable', label: 'Responsable' },
    { name: 'presupuesto', label: 'Presupuesto', type: 'number' },
    { name: 'avance', label: 'Avance (%)', type: 'number' },
    { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date' },
    { name: 'fechaFin', label: 'Fecha de Fin', type: 'date' },
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
        title="Proyectos IT"
        description="Gestión de proyectos tecnológicos en curso"
        icon={Rocket}
        endpoint="/api/inventario/proyectos"
        emptyForm={emptyForm}
        columns={columns}
        formFields={formFields}
        onBeforeSubmit={(form) => ({
          ...form,
          presupuesto: parseFloat(form?.presupuesto) || 0,
          avance: parseInt(form?.avance) || 0,
          fechaInicio: form?.fechaInicio ? new Date(form.fechaInicio).toISOString() : null,
          fechaFin: form?.fechaFin ? new Date(form.fechaFin).toISOString() : null,
          clientId: form?.clientId || undefined,
        })}
        actions={[]}
      />
    </div>
  );
}
