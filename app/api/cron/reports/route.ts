export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sendScheduledReportsByFrequency } from '@/lib/email-service';

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
type Frequency = (typeof VALID_FREQUENCIES)[number];

function isAuthorized(request: Request): boolean {
  // trim: un espacio o salto de línea al copiar la clave en Railway o GitHub no debe romper el cron.
  const secret = request.headers.get('x-cron-secret')?.trim();
  const expected = process.env.CRON_SECRET?.trim();
  return !!expected && secret === expected;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const frequency = searchParams.get('frequency') as Frequency | null;

  if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
    return NextResponse.json(
      { error: `frequency debe ser uno de: ${VALID_FREQUENCIES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const result = await sendScheduledReportsByFrequency(frequency);
    return NextResponse.json({ message: 'Reportes enviados', frequency, ...result });
  } catch (error) {
    console.error('Cron reports error:', error);
    return NextResponse.json({ error: 'Error enviando reportes' }, { status: 500 });
  }
}
