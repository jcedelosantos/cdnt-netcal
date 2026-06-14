'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Alert {
  id: string;
  titulo: string;
  descripcion?: string;
  severidad: string;
  tipo: string;
  leido: boolean;
  createdAt: string;
}

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Regenerar alertas cada 1 hora
    const interval = setInterval(() => {
      fetch('/api/alerts?action=generate').catch(console.error);
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
      setUnreadCount(data.unreadCount || 0);
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
        toast.success('Alertas marcadas como leídas');
      }
    } catch (e) {
      toast.error('Error al actualizar alertas');
    }
  };

  if (loading) return null;

  if (unreadCount === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-700 font-medium">
            ¡Todo está al día!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-red-600" />
            Alertas ({unreadCount})
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAsRead(alerts.map((a) => a.id))}
            >
              Marcar como leído
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 ${
              alert.severidad === 'critical'
                ? 'border-l-red-600 bg-red-50'
                : alert.severidad === 'warning'
                  ? 'border-l-amber-600 bg-amber-50'
                  : 'border-l-blue-600 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-2">
              {alert.severidad === 'critical' ? (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : alert.severidad === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{alert.titulo}</p>
                {alert.descripcion && (
                  <p className="text-xs text-gray-600 mt-1">
                    {alert.descripcion}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(alert.createdAt).toLocaleDateString('es-DO')}
                </p>
              </div>
            </div>
          </div>
        ))}
        {alerts.length > 5 && (
          <p className="text-xs text-gray-500 pt-2">
            +{alerts.length - 5} alertas más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
