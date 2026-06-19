export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado');

  const tecnicos = await prisma.tecnico.findMany({
    where: { userId, ...(estado ? { estado } : {}) },
    include: { rol: true },
    orderBy: { nombre: 'asc' },
  });

  return NextResponse.json(tecnicos);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const data = await request.json();
    const tecnico = await prisma.tecnico.create({
      data: {
        userId,
        nombre: data.nombre,
        codigo: data.codigo || null,
        cedula: data.cedula || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccion: data.direccion || null,
        foto: data.foto || null,
        rolId: data.rolId || null,
        especialidades: data.especialidades || null,
        tarifaDiaria: parseFloat(data.tarifaDiaria) || 0,
        tarifaHora: data.tarifaHora ? parseFloat(data.tarifaHora) : null,
        tarifaHoraExtra: parseFloat(data.tarifaHoraExtra) || 0,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : null,
        estado: data.estado || 'activo',
        tipoContratacion: data.tipoContratacion || 'fijo',
        datosBancarios: data.datosBancarios || null,
        notas: data.notas || null,
      },
      include: { rol: true },
    });
    return NextResponse.json(tecnico);
  } catch (error: any) {
    console.error('Error creating tecnico:', error);
    return NextResponse.json({ error: 'Error al crear técnico' }, { status: 500 });
  }
}
