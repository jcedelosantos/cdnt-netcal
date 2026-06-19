'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, User, Phone, Mail, MapPin, Banknote, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TIPOS = ['fijo', 'temporal', 'subcontratista', 'ayudante', 'supervisor'];
const ESTADOS = ['activo', 'inactivo', 'suspendido'];
const ROLES_DEFAULT = [
  'Ingeniero de proyecto', 'Supervisor', 'Técnico de redes', 'Técnico de CCTV',
  'Técnico de fibra óptica', 'Técnico electricista', 'Técnico de control de acceso',
  'Instalador', 'Configurador', 'Programador', 'Ayudante técnico', 'Conductor',
  'Personal de apoyo', 'Subcontratista',
];

interface Props {
  tecnico?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function TecnicoForm({ tecnico, onClose, onSaved }: Props) {
  const editing = !!tecnico;
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    rolId: '',
    rolNuevo: '',
    tipoContratacion: 'fijo',
    tarifaDiaria: '',
    tarifaHora: '',
    tarifaHoraExtra: '',
    fechaIngreso: '',
    estado: 'activo',
    notas: '',
  });

  useEffect(() => {
    fetch('/api/tecnicos/roles').then(r => r.ok ? r.json() : []).then(setRoles).catch(() => {});
    if (tecnico) {
      setForm({
        nombre: tecnico.nombre ?? '',
        codigo: tecnico.codigo ?? '',
        cedula: tecnico.cedula ?? '',
        telefono: tecnico.telefono ?? '',
        email: tecnico.email ?? '',
        direccion: tecnico.direccion ?? '',
        rolId: tecnico.rolId ?? '',
        rolNuevo: '',
        tipoContratacion: tecnico.tipoContratacion ?? 'fijo',
        tarifaDiaria: tecnico.tarifaDiaria?.toString() ?? '',
        tarifaHora: tecnico.tarifaHora?.toString() ?? '',
        tarifaHoraExtra: tecnico.tarifaHoraExtra?.toString() ?? '',
        fechaIngreso: tecnico.fechaIngreso ? tecnico.fechaIngreso.split('T')[0] : '',
        estado: tecnico.estado ?? 'activo',
        notas: tecnico.notas ?? '',
      });
    }
  }, [tecnico]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setLoading(true);

    try {
      let rolId = form.rolId;
      // Create new rol if typed
      if (form.rolNuevo.trim()) {
        const rRes = await fetch('/api/tecnicos/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: form.rolNuevo.trim(), tarifaDiaria: form.tarifaDiaria }),
        });
        if (rRes.ok) { const r = await rRes.json(); rolId = r.id; }
      }

      const payload = { ...form, rolId: rolId || null };
      const url = editing ? `/api/tecnicos/${tecnico.id}` : '/api/tecnicos';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a ${tecnico?.nombre}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    await fetch(`/api/tecnicos/${tecnico.id}`, { method: 'DELETE' });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">{editing ? 'Editar Técnico' : 'Nuevo Técnico'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Datos personales */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><User className="w-4 h-4" /> Datos personales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nombre completo *</Label>
                <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del técnico" required />
              </div>
              <div>
                <Label>Código / ID interno</Label>
                <Input value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="TEC-001" />
              </div>
              <div>
                <Label>Cédula / Documento</Label>
                <Input value={form.cedula} onChange={e => set('cedula', e.target.value)} placeholder="000-0000000-0" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="809-000-0000" />
              </div>
              <div>
                <Label>Correo electrónico</Label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
              <div className="sm:col-span-2">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Dirección del técnico" />
              </div>
            </div>
          </section>

          {/* Rol y contratación */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Rol y Contratación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Rol</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.rolId} onChange={e => set('rolId', e.target.value)}>
                  <option value="">Sin rol asignado</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div>
                <Label>Crear nuevo rol (opcional)</Label>
                <Input value={form.rolNuevo} onChange={e => set('rolNuevo', e.target.value)} placeholder="Nombre del nuevo rol" />
              </div>
              <div>
                <Label>Tipo de contratación</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.tipoContratacion} onChange={e => set('tipoContratacion', e.target.value)}>
                  {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <Label>Estado</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.estado} onChange={e => set('estado', e.target.value)}>
                  {ESTADOS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <Label>Fecha de ingreso</Label>
                <Input type="date" value={form.fechaIngreso} onChange={e => set('fechaIngreso', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Tarifas */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Banknote className="w-4 h-4" /> Tarifas (RD$)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Tarifa diaria *</Label>
                <Input type="number" min="0" value={form.tarifaDiaria} onChange={e => set('tarifaDiaria', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Tarifa por hora</Label>
                <Input type="number" min="0" value={form.tarifaHora} onChange={e => set('tarifaHora', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Tarifa hora extra</Label>
                <Input type="number" min="0" value={form.tarifaHoraExtra} onChange={e => set('tarifaHoraExtra', e.target.value)} placeholder="0.00" />
              </div>
            </div>
          </section>

          {/* Notas */}
          <div>
            <Label>Notas</Label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editing && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading || !form.nombre.trim()}>
                {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editing ? 'Guardar cambios' : 'Crear técnico'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
