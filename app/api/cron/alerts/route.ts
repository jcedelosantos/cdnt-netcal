export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAllAlerts } from '@/lib/alert-service';

function isAuthorized(request: Request): boolean {
  const secret = request.headers.get('x-cron-secret');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });

    const totals = { licenseAlerts: 0, maintenanceAlerts: 0, paymentAlerts: 0, total: 0 };

    for (const user of users) {
      const result = await generateAllAlerts(user.id);
      totals.licenseAlerts += result.licenseAlerts;
      totals.maintenanceAlerts += result.maintenanceAlerts;
      totals.paymentAlerts += result.paymentAlerts;
      totals.total += result.total;
    }

    return NextResponse.json({
      message: 'Alertas generadas',
      usersProcessed: users.length,
      ...totals,
    });
  } catch (error) {
    console.error('Cron alerts error:', error);
    return NextResponse.json({ error: 'Error generando alertas' }, { status: 500 });
  }
}
