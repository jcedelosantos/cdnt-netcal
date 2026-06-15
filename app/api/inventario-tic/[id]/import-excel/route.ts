export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { processExcelFile } from '@/lib/excel-processor';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const inventarioId = params.id;
    const userId = (session?.user as any)?.id;

    // Verify inventory belongs to user
    const inventario = await prisma.ticInventario.findFirst({
      where: {
        id: inventarioId,
        userId,
      },
    });

    if (!inventario) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    // Get file from request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Solo se aceptan archivos .xlsx o .xls' },
        { status: 400 }
      );
    }

    // Process Excel
    const buffer = await file.arrayBuffer();
    const result = await processExcelFile(Buffer.from(buffer), inventarioId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error importing Excel:', error);
    return NextResponse.json(
      { error: 'Error al procesar archivo' },
      { status: 500 }
    );
  }
}
