'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Bell, Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';

interface Alert {
  id: string;
  titulo: string;
  descripcion?: string;
  severidad: string;
  tipo: string;
  leido: boolean;
  referenceType?: string;
  createdAt: string;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      // Obtener todas las alertas, no solo no leídas
      const allAlertsRes = await fetch('/api/alerts?action=all');
      const allAlertsData = await allAlertsRes.json();

      setAlerts(allAlertsData.alerts || data.alerts || []);
      setStats({
        total: (allAlertsData.alerts || data.alerts || []).length,
        critical: (allAlertsData.alerts || data.alerts || []).filter(
          (a: Alert) => a.severidad === 'critical'
        ).length,
        warning: (allAlertsData.alerts || data.alerts || []).filter(
          (a: Alert) => a.severidad === 'warning'
        ).length,
        info: (allAlertsData.alerts || data.alerts || []).filter(
          (a: Alert) => a.severidad === 'info'
        ).length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertIds: string[]) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_as_read', alertIds }),
      });

      if (res.ok) {
        await fetchAlerts();
        setSelectedAlerts([]);
        toast.success('Alertas marcadas como leídas');
      }
    } catch (e) {
      toast.error('Error al actualizar alertas');
    }
  };

  const filteredAlerts = alerts.filter(
    (a) => filter === 'all' || a.severidad === filter
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">
            Centro de Alertas
          </h1>
          <p className="text-gray-500 mt-2">
            Gestiona licencias, equipos y pagos pendientes
          </p>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Total de Alertas</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 font-medium mb-1">Críticas</p>
              <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-600 font-medium mb-1">Advertencias</p>
              <p className="text-3xl font-bold text-amber-600">{stats.warning}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-600 font-medium mb-1">Información</p>
              <p className="text-3xl font-bold text-blue-600">{stats.info}</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filtros */}
      <FadeIn delay={0.2}>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todas ({stats.total})
          </Button>
          <Button
            variant={filter === 'critical' ? 'default' : 'outline'}
            onClick={() => setFilter('critical')}
            className={filter === 'critical' ? 'bg-red-600' : ''}
          >
            Críticas ({stats.critical})
          </Button>
          <Button
            variant={filter === 'warning' ? 'default' : 'outline'}
            onClick={() => setFilter('warning')}
            className={filter === 'warning' ? 'bg-amber-600' : ''}
          >
            Advertencias ({stats.warning})
          </Button>
        </div>
      </FadeIn>

      {/* Alertas */}
      <FadeIn delay={0.3}>
        {filteredAlerts.length === 0 ? (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-green-700 mb-2">
                ¡Sin alertas!
              </p>
              <p className="text-sm text-green-600">
                Todo está funcionando correctamente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {selectedAlerts.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    handleMarkAsRead(selectedAlerts)
                  }
                >
                  Marcar {selectedAlerts.length} como leído
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAlerts([])}
                >
                  Limpiar selección
                </Button>
              </div>
            )}

            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`cursor-pointer transition-colors ${
                  selectedAlerts.includes(alert.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => {
                  setSelectedAlerts((prev) =>
                    prev.includes(alert.id)
                      ? prev.filter((id) => id !== alert.id)
                      : [...prev, alert.id]
                  );
                }}
              >
                <CardContent className="pt-6">
                  <div
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severidad === 'critical'
                        ? 'border-l-red-600 bg-red-50'
                        : alert.severidad === 'warning'
                          ? 'border-l-amber-600 bg-amber-50'
                          : 'border-l-blue-600 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.severidad === 'critical' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      ) : alert.severidad === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{alert.titulo}</p>
                        {alert.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.descripcion}
                          </p>
                        )}
                        <div className="flex gap-3 mt-3 text-xs">
                          <span className="text-gray-500">
                            {new Date(alert.createdAt).toLocaleDateString('es-DO')}
                          </span>
                          <span className="px-2 py-1 rounded bg-white text-gray-700">
                            {alert.tipo.replace('_', ' ')}
                          </span>
                          {!alert.leido && (
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                              No leída
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
