'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Users, Rocket, Shield, TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/template-data';

const ICONS = {
  Users,
  Rocket,
  Shield,
  TrendingUp,
};

interface TemplatePreloadProps {
  clientId: string;
  onSuccess?: () => void;
}

export default function TemplatePreload({ clientId, onSuccess }: TemplatePreloadProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleLoadTemplate = async (categoryKey: string) => {
    if (!clientId) {
      toast.error('Selecciona un cliente primero');
      return;
    }

    setLoading(categoryKey);
    try {
      const res = await fetch('/api/inventario/template-preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, category: categoryKey }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Error al cargar plantilla');
        return;
      }

      const data = await res.json();
      toast.success(data.message);
      setCompleted(new Set([...completed, categoryKey]));
      onSuccess?.();
    } catch (e) {
      toast.error('Error al procesar plantilla');
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const categories = Object.entries(TEMPLATES);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        ⚡ Precarga Rápida
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Precarga Rápida</DialogTitle>
            <DialogDescription>
              Carga datos predefinidos por categoría. Edita después si es necesario.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(([key, template]) => {
              const Icon = ICONS[template.icon as keyof typeof ICONS];
              const isLoading = loading === key;
              const isCompleted = completed.has(key);

              return (
                <Card key={key} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className={`w-6 h-6 mt-1 text-${template.color}-600`} />
                      <div>
                        <h3 className="font-semibold">{template.label}</h3>
                        <p className="text-sm text-gray-500">
                          {template.data.length} elementos
                        </p>
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <ul className="text-xs text-gray-600 space-y-1 ml-9">
                    {template.data.slice(0, 3).map((item, i) => (
                      <li key={i}>• {item.nombre}</li>
                    ))}
                    {template.data.length > 3 && (
                      <li>+ {template.data.length - 3} más</li>
                    )}
                  </ul>

                  <Button
                    onClick={() => handleLoadTemplate(key)}
                    disabled={isLoading || isCompleted}
                    variant={isCompleted ? 'secondary' : 'default'}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Cargando...
                      </>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Cargado
                      </>
                    ) : (
                      '+ Cargar'
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t text-sm text-gray-600">
            💡 <strong>Tip:</strong> Puedes cargar múltiples categorías. Todos los datos son editables después.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
