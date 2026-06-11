export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session?.user as any)?.id;

    const project = await prisma.project.findFirst({ where: { id: params.id, userId } });
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const material = await prisma.projectMaterial.findFirst({
      where: { id: params.materialId, projectId: params.id, esPersonalizado: true },
    });
    if (!material) return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });

    await prisma.projectMaterial.delete({ where: { id: params.materialId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete material error:', error);
    return NextResponse.json({ error: 'Error al eliminar material' }, { status: 500 });
  }
}
