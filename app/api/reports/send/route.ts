export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendScheduledReports } from '@/lib/email-service';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await sendScheduledReports();
    return NextResponse.json({
      message: 'Reportes enviados',
      ...result,
    });
  } catch (error: any) {
    console.error('Error sending reports:', error);
    return NextResponse.json(
      { error: 'Error al enviar reportes' },
      { status: 500 }
    );
  }
}
