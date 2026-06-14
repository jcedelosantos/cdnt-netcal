export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getUnreadAlerts,
  markAlertsAsRead,
  generateAllAlerts,
} from '@/lib/alert-service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'generate') {
      // Generar nuevas alertas
      const result = await generateAllAlerts(userId);
      return NextResponse.json({
        message: 'Alertas generadas',
        ...result,
      });
    }

    // Por defecto, obtener alertas no leídas
    const alerts = await getUnreadAlerts(userId);
    return NextResponse.json({
      alerts,
      unreadCount: alerts.length,
      critical: alerts.filter((a) => a.severidad === 'critical').length,
      warning: alerts.filter((a) => a.severidad === 'warning').length,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const body = await request.json();
    const { action, alertIds } = body;

    if (action === 'mark_as_read') {
      await markAlertsAsRead(userId, alertIds || []);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error al procesar alerta' },
      { status: 500 }
    );
  }
}
