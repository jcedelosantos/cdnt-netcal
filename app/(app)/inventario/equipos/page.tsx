'use client';
import { Monitor, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CRUDPanel from '@/components/crud-panel';
import ImportEquipos from '@/app/(app)/inventario/_components/import-equipos';
import { formatUSD } from '@/lib/utils';
import { TIPOS_EQUIPO, ESTADOS_EQUIPO } from '@/lib/constants';

export default function InventarioEquiposPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const emptyForm = {
    nombre: '',
    tipoEquipo: 'otro',
    fabricante: '',
    numeroSerie: '',
    direccionIp: '',
    direccionMac: '',
    fechaCompra: '',
    garantia: '',
    estado: 'activo',
    responsable: '',
    costoUsd: 0,
    comentarios: '',
    clientId: '',
  };

  const tipoLabel = (v: string) =>
    TIPOS_EQUIPO.find((t) => t.value === v)?.label ?? v;
  const estadoLabel = (v: string) =>
    ESTADOS_EQUIPO.find((s) => s.value === v)?.label ?? v;

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'numeroSerie',
      label: 'Serial',
      render: (v: any) =>
        v ? (
          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            {v}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    { key: 'direccionIp', label: 'IP', render: (v: any) => v ?? '-' },
    { key: 'fabricante', label: 'Fabricante', render: (v: any) => v ?? '-' },
    {
      key: 'tipoEquipo',
      label: 'Tipo',
      render: (v: any) => (
        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
          {tipoLabel(v ?? 'otro')}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (v: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            v === 'activo'
              ? 'bg-green-100 text-green-800'
              : v === 'inactivo'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {estadoLabel(v ?? 'activo')}
        </span>
      ),
    },
    { key: 'responsable', label: 'Responsable', render: (v: any) => v ?? '-' },
    {
      key: 'costoUsd',
      label: 'Costo',
      render: (v: any) => formatUSD(v),
    },
  ];

  const formFields = [
    { name: 'nombre', label: 'Nombre', required: true },
    {
      name: 'tipoEquipo',
      label: 'Tipo de Equipo',
      type: 'select',
      options: TIPOS_EQUIPO,
    },
    { name: 'fabricante', label: 'Fabricante' },
    { name: 'numeroSerie', label: 'Serial / SN' },
    { name: 'direccionIp', label: 'Dirección IP' },
    { name: 'direccionMac', label: 'Dirección MAC' },
    { name: 'fechaCompra', label: 'Fecha de Compra', type: 'date' },
    { name: 'garantia', label: 'Garantía hasta', type: 'date' },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_EQUIPO,
    },
    { name: 'responsable', label: 'Responsable' },
    { name: 'costoUsd', label: 'Costo (USD)', type: 'number' },
    { name: 'clientId', label: 'Cliente', type: 'select', options: [] },
    { name: 'comentarios', label: 'Comentarios', type: 'textarea' },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Equipos Tecnológicos</h1>
          <p className="text-gray-500 mt-2">Inventario de dispositivos y equipos de red</p>
        </div>
        <div className="flex gap-2">
          <ImportEquipos onSuccess={() => setRefreshKey(k => k + 1)} />
        </div>
      </div>

      <CRUDPanel
        key={refreshKey}
        title=""
        description=""
        icon={Monitor}
        endpoint="/api/inventario/equipos"
        emptyForm={emptyForm}
        columns={columns}
        formFields={formFields}
        onBeforeSubmit={(form) => ({
          ...form,
          costoUsd: parseFloat(form?.costoUsd) || 0,
          fechaCompra: form?.fechaCompra
            ? new Date(form.fechaCompra).toISOString()
            : null,
          garantia: form?.garantia
            ? new Date(form.garantia).toISOString()
            : null,
          direccionIp: form?.direccionIp || null,
          direccionMac: form?.direccionMac || null,
          clientId: form?.clientId || undefined,
        })}
        actions={[]}
      />
    </div>
  );
}
