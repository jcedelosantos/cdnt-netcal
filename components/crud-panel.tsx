'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/page-header';
import DataTable from '@/components/data-table';
import Modal from '@/components/modal';
import { toast } from 'sonner';
import { ZodSchema } from 'zod';

interface CRUDPanelProps {
  title: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
  emptyForm: Record<string, any>;
  columns: Array<{ key: string; label: string; render?: (v: any, item?: any) => any }>;
  formFields: Array<{
    name: string;
    label: string;
    type?: string;
    options?: Array<{ value: string; label: string }>;
    required?: boolean;
  }>;
  queryParams?: Record<string, string>;
  onBeforeSubmit?: (form: any) => any;
  onAfterFetch?: (items: any[]) => any;
  actions?: Array<{
    label: string;
    icon: React.ElementType;
    onClick: (items: any[]) => Promise<void>;
  }>;
}

export default function CRUDPanel({
  title,
  description,
  icon: Icon,
  endpoint,
  emptyForm,
  columns,
  formFields,
  queryParams = {},
  onBeforeSubmit,
  onAfterFetch,
  actions = [],
}: CRUDPanelProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(() => {
    const params = new URLSearchParams(queryParams);
    if (search) params.set('search', search);
    fetch(`${endpoint}?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const items = Array.isArray(d) ? d : [];
        setItems(onAfterFetch ? onAfterFetch(items) : items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, queryParams, endpoint, onAfterFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let body = { ...form };
      if (onBeforeSubmit) body = onBeforeSubmit(body);

      const url = editId ? `${endpoint}/${editId}` : endpoint;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.toString?.() || data?.error || 'Error al guardar');
        return;
      }

      toast.success(editId ? 'Actualizado' : 'Creado');
      setShowForm(false);
      setForm({ ...emptyForm });
      setEditId(null);
      fetchData();
    } catch (err: any) {
      toast.error('Error al guardar');
      console.error(err);
    }
  };

  const handleEdit = (item: any) => {
    const editForm: Record<string, any> = {};
    Object.keys(emptyForm).forEach((key) => {
      let value = item?.[key];
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      }
      editForm[key] = value ?? emptyForm[key];
    });
    setForm(editForm);
    setEditId(item?.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      toast.success('Eliminado');
      fetchData();
    } catch (err: any) {
      toast.error('Error al eliminar');
      console.error(err);
    }
  };

  const displayColumns = [
    ...columns,
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: any, item: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(item)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            aria-label={`Editar ${item?.nombre ?? 'registro'}`}
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item?.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label={`Eliminar ${item?.nombre ?? 'registro'}`}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <PageHeader
        title={title}
        description={description}
        icon={Icon}
        actions={
          <div className="flex gap-2 flex-wrap">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.onClick(items)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <action.icon className="w-4 h-4" /> {action.label}
              </button>
            ))}
            <button
              onClick={() => {
                setForm({ ...emptyForm });
                setEditId(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
        }
      />

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1"
        />
      </div>

      <DataTable columns={displayColumns} data={items} loading={loading} />

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setForm({ ...emptyForm });
          setEditId(null);
        }}
        title={editId ? 'Editar' : 'Crear nuevo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-600">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={form?.[field.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required={field.required}
                >
                  <option value="">Seleccionar...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={form?.[field.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={3}
                />
              ) : (
                <input
                  type={field.type ?? 'text'}
                  value={form?.[field.name] ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [field.name]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ ...emptyForm });
                setEditId(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              {editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
